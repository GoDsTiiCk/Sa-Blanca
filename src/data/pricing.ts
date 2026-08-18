export type PricingVersion = {
  id: string
  effectiveFrom: string

  weekday: {
    turno1: number
    turno2: number
    turno3: number
  }

  weekendHoliday: {
    turno1: number
    turno2: number
    turno3: number
  }

  cleaning: number
  capacitySurcharge: number

  shifts: {
    turno1: {
      start: string
      end: string
  }
    turno2: {
      start: string
      end: string
    }
    turno3: {
      start: string
      end: string
    }
  }

  createdAt: string
}

const STORAGE_KEY =
  'sa-blanca-pricing-history'

const defaultPricing: PricingVersion = {
  id: 'TARIFA-2026-08-17',

  effectiveFrom: '2026-08-17',

  weekday: {
    turno1: 100,
    turno2: 120,
    turno3: 150,
  },

  weekendHoliday: {
    turno1: 130,
    turno2: 150,
    turno3: 250,
  },

  cleaning: 70,

  capacitySurcharge: 100,

  shifts: {
    turno1: {
      start: '10:00',
      end: '13:00',
    },

    turno2: {
      start: '15:00',
      end: '20:00',
    },

    turno3: {
      start: '21:00',
      end: '03:00',
    },
  },

  createdAt:
    '2026-08-17T00:00:00',
}

function canUseStorage() {
  return (
    typeof window !== 'undefined'
  )
}

function sortVersions(
  versions: PricingVersion[],
) {
  return [...versions].sort(
    (a, b) =>
      b.effectiveFrom.localeCompare(
        a.effectiveFrom,
      ),
  )
}

export function getPricingHistory(): PricingVersion[] {
  if (!canUseStorage()) {
    return [defaultPricing]
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    if (!stored) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          defaultPricing,
        ]),
      )

      return [defaultPricing]
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return [defaultPricing]
    }

    return sortVersions(
      parsed as PricingVersion[],
    )
  } catch {
    return [defaultPricing]
  }
}

export function savePricingHistory(
  versions: PricingVersion[],
) {
  if (!canUseStorage()) {
    return
  }

  const sorted =
    sortVersions(versions)

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sorted),
  )

  window.dispatchEvent(
    new CustomEvent(
      'sa-blanca-pricing-updated',
    ),
  )
}

export function getCurrentPricing(
  date = getTodayString(),
): PricingVersion {
  const history =
    getPricingHistory()

  const applicable =
    history
      .filter(
        (version) =>
          version.effectiveFrom <=
          date,
      )
      .sort(
        (a, b) =>
          b.effectiveFrom.localeCompare(
            a.effectiveFrom,
          ),
      )

  return (
    applicable[0] ??
    history[history.length - 1] ??
    defaultPricing
  )
}

export function getPricingForDate(
  date: string,
): PricingVersion {
  return getCurrentPricing(date)
}

export function addPricingVersion(
  pricing: PricingVersion,
) {
  const history =
    getPricingHistory()

  const withoutSameDate =
    history.filter(
      (version) =>
        version.effectiveFrom !==
        pricing.effectiveFrom,
    )

  savePricingHistory([
    ...withoutSameDate,
    pricing,
  ])
}

export function deletePricingVersion(
  pricingId: string,
) {
  const history =
    getPricingHistory()

  /*
   * Nunca permitimos dejar
   * la aplicación sin ninguna
   * tarifa.
   */
  if (history.length <= 1) {
    return
  }

  const updated =
    history.filter(
      (version) =>
        version.id !== pricingId,
    )

  savePricingHistory(updated)
}

export function updatePricingVersion(
  pricing: PricingVersion,
) {
  const history =
    getPricingHistory()

  const updated =
    history.map((version) =>
      version.id === pricing.id
        ? pricing
        : version,
    )

  savePricingHistory(updated)
}

export function subscribeToPricing(
  callback: () => void,
) {
  if (!canUseStorage()) {
    return () => {}
  }

  const customHandler = () => {
    callback()
  }

  const storageHandler = (
    event: StorageEvent,
  ) => {
    if (
      event.key === STORAGE_KEY
    ) {
      callback()
    }
  }

  window.addEventListener(
    'sa-blanca-pricing-updated',
    customHandler,
  )

  window.addEventListener(
    'storage',
    storageHandler,
  )

  return () => {
    window.removeEventListener(
      'sa-blanca-pricing-updated',
      customHandler,
    )

    window.removeEventListener(
      'storage',
      storageHandler,
    )
  }
}

export function getTodayString() {
  const date = new Date()

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatPricingDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  )
}

export function createPricingId(
  effectiveFrom: string,
) {
  return `TARIFA-${effectiveFrom}`
}