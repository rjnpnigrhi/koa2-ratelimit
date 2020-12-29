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
    this.client = new redis(config);
  }

  /**
   * _hit
   * @access private
   * @param {*} key 
   * @param {*} options 
   * @param {*} weight 
   */
  async _hit(key, options, weight) {

    let [counter, dateEnd] = await this.client.multi().get(key).ttl(key).exec();
    
    if(counter === null) {
      counter = weight;
      dateEnd = Date.now() + options.interval;

      const seconds = Math.ceil(options.interval / 1000);
      await this.client.setex(key, seconds, counter);
    }else {
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
