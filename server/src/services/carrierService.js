const terminalService = require('./terminalService');
const cache = require('memory-cache');

class CarrierService {
  constructor() {
    this.carriers = {};
    this.initializeCarriers();
  }

  async initializeCarriers() {
    try {
      const carriers = await terminalService.getCarriers('NG'); // Default to Nigeria
      carriers.forEach(carrier => {
        this.carriers[carrier.carrier_id] = {
          ...carrier,
          active: true
        };
      });
    } catch (error) {
      console.error('Failed to initialize carriers:', error);
    }
  }

  async getBestCarrier(parcel, pickup, delivery) {
    const rates = await this.getAllCarrierRates(parcel, pickup, delivery);
    return rates.sort((a, b) => a.amount - b.amount)[0];
  }

  async getAllCarrierRates(parcel, pickup, delivery) {
    const cacheKey = `carrier_rates_${parcel.id}_${pickup.city}_${delivery.city}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const rates = [];
    for (const carrierId of Object.keys(this.carriers)) {
      if (this.carriers[carrierId].active) {
        try {
          const rate = await terminalService.getCarrierRates(
            carrierId,
            parcel.id,
            pickup,
            delivery
          );
          rates.push(rate);
        } catch (error) {
          console.error(`Failed to get rates for carrier ${carrierId}:`, error);
        }
      }
    }

    cache.put(cacheKey, rates, 1800000); // Cache for 30 minutes
    return rates;
  }

  isCarrierAvailable(carrierId, destination) {
    const carrier = this.carriers[carrierId];
    return carrier && carrier.active && carrier.coverage.includes(destination.country);
  }
}

module.exports = new CarrierService(); 