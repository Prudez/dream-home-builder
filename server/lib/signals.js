import { indexBy, groupBy, resolveFinish, fmtKES } from '../../shared/cost.js';
import { furnitureTier } from './profile.js';
import { replaySession } from './replay.js';

// Plain-language buyer-intent signals, ported from the prototype's
// `insights` useMemo (dream-home-builder-v4.jsx lines 664-701). The
// "current state" signals (finish expectation, splurge rooms, lifestyle
// flags, etc.) read the lead's linked design snapshot — the prototype's
// equivalent of live `placed` state at the moment a player finished. The
// cumulative signals (peak cost, removals, grows/shrinks, upgrades,
// financing) come from replaying the session's full event log, since those
// have to survive a player later removing or downgrading the very thing
// that produced them (see docs/phases/README.md's "peak cost matters even
// after rooms are removed").
//
// Lead score (0-100), documented here and mirrored in docs/phases/phase-5.md:
//
//   Budget band (peak cost): entry / mid / premium ......... 5 / 15 / 25
//   Financing readiness: mortgage or cash buyer ............ 20
//                         build in phases ................... 10
//                         dreaming or no answer ............... 0
//   Household signal (>=3 bedrooms) ......................... 10
//   Furnishing spend >= KES 800K ............................ 10
//   Aspiration (>=2 upgrades) ............................... 10
//   Premium flag (has a pool) ............................... 10
//   Lifestyle flags (entertainer, pool loungers, bathtub, furnished DSQ,
//     executive study, detail-oriented add-ons) ... 5 each, capped at 15
//   Price sensitivity penalty (>=2 shrinks+removals) ....... -15
//
// The no-penalty maximum sums to exactly 100. Final score is clamped to
// [0, 100].

function budgetBandOf(peakCost) {
  if (peakCost < 12000000) return 'Under 12M — entry';
  if (peakCost < 20000000) return '12–20M — mid market';
  return '20M+ — premium';
}

function budgetPointsOf(peakCost) {
  if (peakCost < 12000000) return 5;
  if (peakCost < 20000000) return 15;
  return 25;
}

function financingPointsOf(financing) {
  if (financing === 'Mortgage / bank financing' || financing === 'Savings — cash buyer') return 20;
  if (financing === 'Build in phases over time') return 10;
  return 0;
}

export function computeLeadSignals({ design, events, catalog }) {
  const roomsByKey = indexBy(catalog.rooms, 'key');
  const furnitureById = indexBy(catalog.furniture, 'id');
  const furnitureByType = groupBy(catalog.furniture, 'roomType');
  const addonsByType = groupBy(catalog.furnitureAddons, 'roomType');
  const finishesByGroup = groupBy(catalog.finishes, 'groupName');
  const finishesByGroupKey = Object.fromEntries(
    Object.entries(finishesByGroup).map(([group, entries]) => [group, indexBy(entries, 'key')])
  );

  const { rooms, stylePack, floors, shellKey } = design.snapshot;
  const { peakCost, removals, grows, shrinks, upgrades, financing } = replaySession(events, catalog, {
    shellKey,
    stylePack,
  });

  const has = (type) => rooms.some((r) => r.type === type);
  const tier = (r) => furnitureTier(r, furnitureByType);
  const furnPick = (type, idx) => rooms.some((r) => r.type === type && tier(r) >= idx);
  const beds = rooms.filter((r) => r.type === 'bedroom' || r.type === 'master').length;

  const finished = rooms.filter((r) => roomsByKey[r.type]?.groupName);
  const finishOf = (r) => resolveFinish(r, roomsByKey[r.type], finishesByGroupKey);

  const signals = [];

  const shell = indexBy(catalog.shells, 'key')[shellKey];
  const pack = indexBy(catalog.stylePacks, 'key')[stylePack];
  if (pack) signals.push({ key: 'style_segment', label: 'Style segment', value: `${pack.name} → creative direction for retargeting` });
  if (shell) signals.push({ key: 'build_ambition', label: 'Build ambition', value: `${shell.name} · ${floors} floor${floors !== 1 ? 's' : ''}` });

  const budgetBand = budgetBandOf(peakCost);
  signals.push({ key: 'budget_band', label: 'Budget band (peak)', value: budgetBand });

  let finishMult = 1;
  let furnitureSpend = 0;
  if (finished.length > 0) {
    const area = finished.reduce((s, r) => s + r.w * r.h, 0);
    finishMult = finished.reduce((s, r) => {
      const finish = finishOf(r);
      return s + (finish ? Number(finish.mult) : 1) * r.w * r.h;
    }, 0) / area;
    const expectation = finishMult < 1.1 ? 'Standard spec' : finishMult < 1.3 ? 'Upgraded spec' : 'Luxury spec — show premium units';
    signals.push({ key: 'finish_expectation', label: 'Finish expectation', value: expectation });

    const splurge = finished.filter((r) => {
      const finish = finishOf(r);
      return finish && Number(finish.mult) >= 1.45;
    });
    if (splurge.length > 0) {
      const names = splurge.map((r) => roomsByKey[r.type]?.name ?? r.type).join(', ');
      signals.push({ key: 'splurge_rooms', label: 'Splurge rooms', value: `${names} → their real priorities` });
    }

    const darks = finished.filter((r) => {
      const finish = finishOf(r);
      const hex = finish?.colors?.[r.colorIndex ?? 0]?.hex;
      return hex && parseInt(hex.slice(1), 16) < 0x808080;
    });
    if (darks.length >= 2) {
      signals.push({ key: 'palette_taste', label: 'Palette taste', value: 'Dark/rich tones → show moody-lux listings imagery' });
    }
  }

  if (beds > 0) {
    signals.push({
      key: 'household_signal',
      label: 'Household signal',
      value: `${beds} bedroom${beds > 1 ? 's' : ''} → ${beds >= 3 ? 'family buyer' : 'small household'}`,
    });
  }

  const hasPool = has('pool');
  if (hasPool) {
    const poolRoom = rooms.find((r) => r.type === 'pool');
    const poolFinish = poolRoom ? finishOf(poolRoom) : null;
    signals.push({ key: 'premium_flag', label: 'Premium flag', value: `Swimming pool${poolFinish ? ` (${poolFinish.name})` : ''}` });
  }

  const officeRoom = rooms.find((r) => r.type === 'office');
  const executiveStudy = Boolean(officeRoom && tier(officeRoom) >= 1);
  if (officeRoom) {
    signals.push({ key: 'lifestyle_office', label: 'Lifestyle', value: `Home office${executiveStudy ? ' with executive study' : ''} → works from home` });
  }

  const entertainerLounge = furnPick('living', 2);
  const bomaFirePit = rooms.some((r) => r.type === 'garden' && tier(r) === 2);
  const alfrescoDining = !bomaFirePit && furnPick('garden', 1);
  const entertainer = entertainerLounge || bomaFirePit || alfrescoDining;
  if (entertainer) {
    const parts = [entertainerLounge && "entertainer's lounge", bomaFirePit && 'boma fire pit', alfrescoDining && 'alfresco dining'].filter(Boolean);
    signals.push({ key: 'entertainer_signal', label: 'Entertainer signal', value: `${parts.join(' + ')} → hosts guests, sell the compound` });
  }

  const poolLoungers = furnPick('pool', 1);
  if (poolLoungers) signals.push({ key: 'lifestyle_pool', label: 'Lifestyle', value: 'Pool loungers → leisure-first, resort-style living' });

  const bathtub = furnPick('bath', 1);
  if (bathtub) signals.push({ key: 'comfort_signal', label: 'Comfort signal', value: 'Bathtub upgrade → comfort-oriented buyer' });

  const furnishedDsq = furnPick('dsq', 1);
  if (furnishedDsq) signals.push({ key: 'practical_signal', label: 'Practical signal', value: 'Furnished DSQ → live-in staff or rental income plan' });

  const hasBalcony = has('balcony');
  if (hasBalcony) signals.push({ key: 'outdoor_priority', label: 'Lifestyle', value: 'Balcony placed → outdoor space priority' });

  // Detail-oriented signal (Phase 9): a player who switches on 3+ optional
  // furniture add-ons in a single room is engaging past the required
  // choices — same "plain-language lifestyle flag" pattern as the signals
  // above, so it also counts toward lifestyleFlagCount below.
  const detailRoom = rooms
    .map((r) => ({ room: r, addons: Array.isArray(r.addons) ? r.addons : [] }))
    .filter((x) => x.addons.length >= 3)
    .sort((a, b) => b.addons.length - a.addons.length)[0];
  const detailOriented = Boolean(detailRoom);
  if (detailRoom) {
    const addonNames = indexBy(addonsByType[detailRoom.room.type] ?? [], 'addonKey');
    const names = detailRoom.addons.map((k) => addonNames[k]?.name ?? k).join(', ');
    const roomName = roomsByKey[detailRoom.room.type]?.name ?? detailRoom.room.type;
    signals.push({
      key: 'detail_oriented',
      label: 'Engagement signal',
      value: `${names} on ${roomName} → detail-oriented, high engagement`,
    });
  }

  furnitureSpend = rooms.reduce((s, r) => {
    const f = r.furnitureId != null ? furnitureById[r.furnitureId] : null;
    return s + (f ? Number(f.cost) : 0);
  }, 0);
  if (furnitureSpend >= 800000) {
    signals.push({ key: 'furnishing_budget', label: 'Furnishing budget', value: `${fmtKES(furnitureSpend)} on furniture sets → turnkey buyer, show furnished units` });
  }

  if (upgrades >= 2) {
    signals.push({ key: 'aspiration_signal', label: 'Aspiration signal', value: `${upgrades} finish upgrades → aspirational, upsell-receptive` });
  }
  if (grows > shrinks && grows >= 2) {
    signals.push({ key: 'space_priority', label: 'Space priority', value: `${grows} enlargements → space-first buyer` });
  }
  const priceSensitive = shrinks + removals >= 2;
  if (priceSensitive) {
    signals.push({ key: 'price_sensitivity', label: 'Price sensitivity', value: `${shrinks} shrinks, ${removals} removals → budget-conscious` });
  }
  if (financing) {
    signals.push({ key: 'financing_readiness', label: 'Financing readiness', value: financing });
  }

  const budgetPoints = budgetPointsOf(peakCost);
  const financingPoints = financingPointsOf(financing);
  const householdPoints = beds >= 3 ? 10 : 0;
  const furnishingPoints = furnitureSpend >= 800000 ? 10 : 0;
  const aspirationPoints = upgrades >= 2 ? 10 : 0;
  const premiumPoints = hasPool ? 10 : 0;
  const lifestyleFlagCount = [entertainer, poolLoungers, bathtub, furnishedDsq, executiveStudy, detailOriented].filter(Boolean).length;
  const lifestylePoints = Math.min(15, lifestyleFlagCount * 5);
  const pricePenalty = priceSensitive ? 15 : 0;

  const scoreBreakdown = [
    { label: 'Budget band (peak cost)', points: budgetPoints },
    { label: 'Financing readiness', points: financingPoints },
    { label: 'Household signal (≥3 bedrooms)', points: householdPoints },
    { label: 'Furnishing spend ≥ KES 800K', points: furnishingPoints },
    { label: 'Aspiration (≥2 upgrades)', points: aspirationPoints },
    { label: 'Premium flag (has a pool)', points: premiumPoints },
    { label: 'Lifestyle flags', points: lifestylePoints },
    { label: 'Price sensitivity penalty', points: -pricePenalty },
  ];
  const rawScore = scoreBreakdown.reduce((s, b) => s + b.points, 0);
  const leadScore = Math.max(0, Math.min(100, rawScore));

  const raw = {
    peakCost,
    removals,
    grows,
    shrinks,
    upgrades,
    financing,
    bedrooms: beds,
    finishMult,
    furnitureSpend,
    budgetBand,
    hasPool,
    stylePack,
  };

  return { leadScore, scoreBreakdown, signals, raw };
}
