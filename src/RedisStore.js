/**
 * RedisStore
 * 
 * RedisStore for koa2-ratelimit
 * 
 * @author Ashok Vishwakarma <akvlko@gmail.com>
 * @author Rajan Panigrahi <rjnpnigrhi@gmail.com>
 */

/**
 * Store
 * 
 * Existing Store class
 */
const Store = require('./Store.js');

/**
 * redis
 * 
 * ioredis module
 * https://github.com/luin/ioredis
 */
const redis = require("ioredis");
const get = require("lodash.get");

/**
 * RedisStore
 * 
 * Class RedisStore
 */
class RedisStore extends Store {
  /**
   * constructor
   * @param {*} config 
   * 
   * config is redis config
   */
  constructor(config){
    super();
    switch(config.type) {
      case 'sentinel':
        this.client = new redis(config);
        break;
      case 'cluster':
        this.client = new Redis.Cluster(config);        
        break;
      default:
        this.client = new redis(config);
    }
  }

  /**
   * _hit
   * @access private
   * @param {*} key 
   * @param {*} options 
   * @param {*} weight 
   */
  async _hit(key, options, weight) {
    const result = await this.client.multi().ttl(key).get(key).exec();
    let dateEnd = get(result, '[0][1]', null);
    let counter = get(result, '[1][1]', null);

    if (counter === null || Object.is(NaN, parseInt(counter))) {
      counter = weight;
      dateEnd = Date.now() + options.interval;
      const seconds = Math.ceil(options.interval / 1000);
      await this.client.setex(key, seconds, counter);
    } else {
      counter = await this.client.incrby(key, weight);
    }

    return {
      counter,
      dateEnd
    }
  }

  /**
   * incr
   * 
   * Override incr method from Store class
   * @param {*} key 
   * @param {*} options 
   * @param {*} weight 
   */
  async incr(key, options, weight) {
    return await this._hit(key, options, weight);
  }

  /**
   * decrement
   * 
   * Override decrement method from Store class
   * @param {*} key 
   * @param {*} options 
   * @param {*} weight 
   */
  async decrement(key, options, weight) {
    await this.client.decrby(key, weight);
  }

  /**
   * saveAbuse
   * 
   * Override saveAbuse method from Store class
   */
  saveAbuse() {}
}

module.exports = RedisStore;
