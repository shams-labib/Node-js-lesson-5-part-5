/*
 * Title: Check Handler
 * Description: Handler to handle user defined checks
 * Author: Sumit Saha ( Learn with Sumit )
 * Date: 12/11/2020
 *
 */
// dependencies

// step-2 : ekhane amra user handler theke all code niye eshe, modify korbo

const data = require("../../lib/data");
const { parseJSON, createRandomString } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");
// step-16 : and then maxChecks ekhane import kore niye eshe amra amader kaje post e ferot jabo
const { maxChecks } = require("../../helpers/environments");

// module scaffolding
const handler = {};

// step-3 : sob jaygay user er bodole check use korbo
handler.checkHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._check[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._check = {};

// step-4 : then sob get,post,put etc er modde content gulo muche felbo, just function ta thakbe
handler._check.post = (requestProperties, callback) => {
  // step-5: amra ekhon prottekbarer moto data post er somoy validity korbo, and validity korar por direct step-6 e jabo, ekhane dekhe dekhe niche validity input kore nio
  // validate inputs
  const protocol =
    typeof requestProperties.body.protocol === "string" &&
    ["http", "https"].indexOf(requestProperties.body.protocol) > -1
      ? requestProperties.body.protocol
      : false;

  const url =
    typeof requestProperties.body.url === "string" &&
    requestProperties.body.url.trim().length > 0
      ? requestProperties.body.url
      : false;

  const method =
    typeof requestProperties.body.method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : false;

  const successCodes =
    typeof requestProperties.body.successCodes === "object" &&
    requestProperties.body.successCodes instanceof Array
      ? requestProperties.body.successCodes
      : false;

  const timeoutSeconds =
    typeof requestProperties.body.timeoutSeconds === "number" &&
    requestProperties.body.timeoutSeconds % 1 === 0 &&
    requestProperties.body.timeoutSeconds >= 1 &&
    requestProperties.body.timeoutSeconds <= 5
      ? requestProperties.body.timeoutSeconds
      : false;

  //   step-6 : ekhane ekhon amader opurer validation gulo jdi thik thake, tahole amra porer kaj data.read e cole jabo

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // step-7 : tar age amader token ta check korte hobe, eta check er jonno userHandler er post theke copy kore niye aste pari
    const token =
      typeof requestProperties.headersObject.token === "string"
        ? requestProperties.headersObject.token
        : false;

    // step-8 : and then ekhane token er ekta folder lagbe tumi jano, data.read call kore nicher dike agabo
    // lookup the user phone by reading the token
    data.read("tokens", token, (err1, tokenData) => {
      if (!err1 && tokenData) {
        // step-9 : ekhane user er data gulo ke parseJSON e convert kore nibo, tahole amra ekhane user er phone nm ta pabo user er token theke
        const userPhone = parseJSON(tokenData).phone;
        // lookup the user data

        // step-10 : ekhon token theke paoya phone number ta diye amra users folder theke user ta khuje niye ashbo
        data.read("users", userPhone, (err2, userData) => {
          if (!err2 && userData) {
            // step-11 : and then amader token check korar pala, ekhane token ta check korbo, eta valid ki na
            tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
              // step-12 : and then amader token ta valid hole amar porer kaj korbo
              if (tokenIsValid) {
                const userObject = parseJSON(userData);
                // step-13: 1st checks name e ekta folder banabo then already users er data ache ki na check korbo, tahole user na thakleo amra ekta faka Array pabo, Error khabo na
                const userChecks =
                  typeof userObject.checks === "object" &&
                  userObject.checks instanceof Array
                    ? userObject.checks
                    : [];

                // step-14 : so ekhon amader cole jete hobe environment.js e, sekhane amra max kotobar check korbo seta bole dibo
                // step-17 : and then amra ekhane maxCheck diye length ta check kore porer kaje jabo
                if (userChecks.length < maxChecks) {
                  // step-18 : and then amader data create korar pala, ejonno abar notun data er jonno notun checkId banaite createRandomString() niye ashbo amra amader utilities theke, jeta amader age thekei kora silo, and niche bosay dibo
                  const checkId = createRandomString(20);
                  //   step-19 : amader checkObject ta create kore felbo and then create kore felbo, data.create er maddome
                  const checkObject = {
                    id: checkId,
                    userPhone,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };
                  // save the object
                  data.create("checks", checkId, checkObject, (err3) => {
                    if (!err3) {
                      // step-20 : add check id to the user's object
                      userObject.checks = userChecks;
                      userObject.checks.push(checkId);

                      // step-21 : save the new user data
                      data.update("users", userPhone, userObject, (err4) => {
                        if (!err4) {
                          // return the data about the new check
                          callback(200, checkObject);
                        } else {
                          callback(500, {
                            error: "There was a problem in the server side!",
                          });
                        }
                      });
                    } else {
                      callback(500, {
                        error: "There was a problem in the server side!",
                      });
                    }
                  });
                } else {
                  callback(401, {
                    error: "Userhas already reached max check limit!",
                  });
                }
              } else {
                callback(403, {
                  error: "Authentication problem!",
                });
              }
            });
          } else {
            callback(403, {
              error: "User not found!",
            });
          }
        });
      } else {
        callback(403, {
          error: "Authentication problem!",
        });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

// step-22 : so ekhon amader check er pala postMan e, tar jonno prothome headers er modde token dite hobe, then body er modde eta likhte hobe : {
//   "protocol": "http",
//   "url": "google.com",
//   "method": "GET",
//   "successCodes": [200, 201],
//   "timeoutSeconds": 2
// } and eta must check korba tomar .data er modde checks folder ache, and token er validity ache, and then success hole checks folder modde data create hobe

// step-23 : let's start get worked
handler._check.get = (requestProperties, callback) => {
  // step-24 : and then amra tokenHandler er get theke id ta copy paste korbo
  const id =
    typeof requestProperties.queryStringObject.id === "string" &&
    requestProperties.queryStringObject.id.trim().length === 20
      ? requestProperties.queryStringObject.id
      : false;

  //   step-25 : id thik thakle porer kaje jabo, jekhane data read korbo check folder er modde
  if (id) {
    // lookup the check
    data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // step-26 : ekhane opur theke token ta niye ashbo c's amra ekhaneo header theke token ta niye verify korbo
        const token =
          typeof requestProperties.headersObject.token === "string"
            ? requestProperties.headersObject.token
            : false;

        // step-27: then tokenHandler diye verify korbo

        tokenHandler._token.verify(
          token,
          parseJSON(checkData).userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              callback(200, parseJSON(checkData));
            } else {
              callback(403, {
                error: "Authentication failure!",
              });
            }
          },
        );
      } else {
        callback(500, {
          error: "You have a problem in your request",
        });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

// step-28 : and then amader check korar pala, amra ei url er modde valid check id dibo and must headers er modde http://localhost:3000/check?id=wjhkliib1wy5cl45738q diye

// step-29 : so let's start put er kaj boobie, so amra ekhane user je id ta update korte casce tar id dibe, so seta check korar jonno protocol take copy kore niye ashbo, seta change kore niche id te convert kore nibo
handler._check.put = (requestProperties, callback) => {
  const id =
    typeof requestProperties.body.id === "string" &&
    requestProperties.body.id.trim().length === 20
      ? requestProperties.body.id
      : false;

  //   step30 : then amra post theke sob authenticator code niye eshe bosay dibo ekhane
  // validate inputs
  const protocol =
    typeof requestProperties.body.protocol === "string" &&
    ["http", "https"].indexOf(requestProperties.body.protocol) > -1
      ? requestProperties.body.protocol
      : false;

  const url =
    typeof requestProperties.body.url === "string" &&
    requestProperties.body.url.trim().length > 0
      ? requestProperties.body.url
      : false;

  const method =
    typeof requestProperties.body.method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : false;

  const successCodes =
    typeof requestProperties.body.successCodes === "object" &&
    requestProperties.body.successCodes instanceof Array
      ? requestProperties.body.successCodes
      : false;

  const timeoutSeconds =
    typeof requestProperties.body.timeoutSeconds === "number" &&
    requestProperties.body.timeoutSeconds % 1 === 0 &&
    requestProperties.body.timeoutSeconds >= 1 &&
    requestProperties.body.timeoutSeconds <= 5
      ? requestProperties.body.timeoutSeconds
      : false;

  //   step-31 : then amader 1st id thik thakte hobe then, validation er jekono ekta thik thakte hobe nahole ki change korbo put e
  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // step-32 : and then check folder er modde khujbo
      data.read("checks", id, (err1, checkData) => {
        if (!err1 && checkData) {
          // data ta parseJSON e convert korbo
          const checkObject = parseJSON(checkData);
          const token =
            typeof requestProperties.headersObject.token === "string"
              ? requestProperties.headersObject.token
              : false;
          //   step-33 : token diye verify korbo then

          tokenHandler._token.verify(
            token,
            checkObject.userPhone,
            (tokenIsValid) => {
              if (tokenIsValid) {
                // step-34 : tokenValid hole amra ekta ekta kore field check korbo prothome protocol check kore seta alt+shift diye aro niche copy kore, then url, method, successcode etc check korbo
                if (protocol) {
                  checkObject.protocol = protocol;
                }
                if (url) {
                  checkObject.url = url;
                }
                if (method) {
                  checkObject.method = method;
                }
                if (successCodes) {
                  checkObject.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkObject.timeoutSeconds = timeoutSeconds;
                }
                // step-35 : then sob kisu thik thakle amra data ta khuje update kore dibo
                // store the checkObject
                data.update("checks", id, checkObject, (err2) => {
                  if (!err2) {
                    callback(200);
                  } else {
                    callback(500, {
                      error: "There was a server side error!",
                    });
                  }
                });
              } else {
                callback(403, {
                  error: "Authentication error!",
                });
              }
            },
          );
        } else {
          callback(500, {
            error: "There was a problem in the server side!",
          });
        }
      });
    } else {
      callback(400, {
        error: "You must provide at least one field to update!",
      });
    }
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

// step-36 : put onk vlo chele tai take check korte hobena, let's start delete
handler._check.delete = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryStringObject.id === "string" &&
    requestProperties.queryStringObject.id.trim().length === 20
      ? requestProperties.queryStringObject.id
      : false;

  if (id) {
    // lookup the check
    data.read("checks", id, (err1, checkData) => {
      if (!err1 && checkData) {
        const token =
          typeof requestProperties.headersObject.token === "string"
            ? requestProperties.headersObject.token
            : false;

        tokenHandler._token.verify(
          token,
          parseJSON(checkData).userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              // delete the check data
              data.delete("checks", id, (err2) => {
                if (!err2) {
                  data.read(
                    "users",
                    parseJSON(checkData).userPhone,
                    (err3, userData) => {
                      const userObject = parseJSON(userData);
                      if (!err3 && userData) {
                        const userChecks =
                          typeof userObject.checks === "object" &&
                          userObject.checks instanceof Array
                            ? userObject.checks
                            : [];

                        // remove the deleted check id from user's list of checks
                        const checkPosition = userChecks.indexOf(id);
                        if (checkPosition > -1) {
                          userChecks.splice(checkPosition, 1);
                          // resave the user data
                          userObject.checks = userChecks;
                          data.update(
                            "users",
                            userObject.phone,
                            userObject,
                            (err4) => {
                              if (!err4) {
                                callback(200);
                              } else {
                                callback(500, {
                                  error: "There was a server side problem!",
                                });
                              }
                            },
                          );
                        } else {
                          callback(500, {
                            error:
                              "The check id that you are trying to remove is not found in user!",
                          });
                        }
                      } else {
                        callback(500, {
                          error: "There was a server side problem!",
                        });
                      }
                    },
                  );
                } else {
                  callback(500, {
                    error: "There was a server side problem!",
                  });
                }
              });
            } else {
              callback(403, {
                error: "Authentication failure!",
              });
            }
          },
        );
      } else {
        callback(500, {
          error: "You have a problem in your request",
        });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your request",
    });
  }
};

module.exports = handler;
