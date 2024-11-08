const uuid = require('uuid');

const PROTECTION_PLAN_TYPES =["SingleDevice", "MultiDevice", "Family"];
const PROTECTION_PLAN_COST = [29, 49, 69];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

module.exports = {
    
    generatePayloadData: (userContext, events, done) => {
        let randomIndex = getRandomInt(3);

        userContext.vars.Id = uuid.v4();
        userContext.vars.deviceId = "device123";
        userContext.vars.protectionPlanAmount = PROTECTION_PLAN_COST[randomIndex];
        userContext.vars.orderAmount = PROTECTION_PLAN_COST[randomIndex];
        userContext.vars.protectionPlan = PROTECTION_PLAN_TYPES[randomIndex];
        userContext.vars.deviceType ="iphone11";
        userContext.vars.customerOrderId = randomIndex;
        userContext.vars.customerId = "cust123";

        return done();
      },
      printStatus: (requestParams, response, context, ee, next) => {
        
        console.log(`ENDPOINT: [${response.req.method}] ${response.req.path}: ${response.statusCode}`);
        if (response.statusCode >= 400) {
          console.warn(response.body);
        }
        return next();
      }
}