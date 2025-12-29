import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';

export type PrayerTimesMap = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
};

export type CalculationMethodName =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica';

function methodFromName(name: CalculationMethodName) {
  switch (name) {
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'Dubai':
      return CalculationMethod.Dubai();
    case 'MoonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee();
    case 'NorthAmerica':
      return CalculationMethod.NorthAmerica();
    case 'MuslimWorldLeague':
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

export function getPrayerTimesForDate(
  date: Date,
  latitude: number,
  longitude: number,
  method: CalculationMethodName = 'MuslimWorldLeague'
): PrayerTimesMap {
  const coords = new Coordinates(latitude, longitude);
  const params = methodFromName(method);
  const times = new PrayerTimes(coords, date, params);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}
