'use strict'

// Packages
const router = require('express').Router();
// const handlers = require('./handlers');
const axios = require('axios');
let namespaces = require('../helpers/pairing').namespaces
// Modules
const challengeCtrl = require('../../db/controllers/challenge');
// Env variables
const testServiceURL = 'http://localhost:3001/api/test';
const execServiceURL = 'http://localhost:3001/api/exec';

// Run the code from the editor and return the result
// router.post('/codeOutput', handlers.codeOutput);
// router.post('/testCode', handlers.testCode);

// Returns a random challenge, used to provide client with random challenge
router.get('/challenge', challengeCtrl.allChallenge); // returns all challeneges
router.post('/challenge',  challengeCtrl.addChallenge);

// router.get('/challenge/:id', challengeCtrl.serveChallenge); // returns individual challenge
// router.post('/api/challenge', challengeCtrl.postChallenge); //for when posting challenge is available

router.post('/codeOutput', (req, res) => {
  return axios.post(execServiceURL, {
    "attempt": req.body.code
  })
    .then(resp => {
      res.status(200).json(resp.data);
    })
});

router.post('/mocha', (req, res) => {
  challengeCtrl.findChallenge(req.body.challengeID)
    .then((challenge) => {
      
      return axios.post(testServiceURL, {
        "attempt": req.body.code,
        "solution": challenge.solutions,
        "test": challenge.test
      })
        .then(resp => {
        // console.log('AXIOS RESPONSE, ', resp.data.score);
        const data = JSON.parse(resp.data.data)
        //TODO: Add check to see if they passed all test cases
        if (data.stats.passes === data.stats.tests) {
          namespaces[req.body.pairID].socket.emit('game won', {
            client: req.body.clientID,
            score: resp.data.score,
            passes: data.stats.passes,
            tests: data.stats.tests
          })
        }
        res.status(200).json(resp.data);
        })
        .catch(err => {
        console.error('Error in testing service', err);
        })
    })
});

router.post('/mocha/addchallenge', (req, res) => {
  return axios.post(testServiceURL, {
    "attempt": req.body.solutions,
    "solution": req.body.solutions,
    "test": req.body.test
  })
    .then(resp => {
      // console.log('req body', req.body); 
      // if this happens and resp.data.err is > 0 JSON.parse will throw unexpected end of input error
      // check if resp.data.err length is greater than 0
      // if yes then send back err
      if(resp.data.err.length > 0) {
        res.send(resp.data.err);
      } else {
        // console.log('AXIOS RESPONSE', resp.data.data);
        const data = JSON.parse(resp.data.data);
        var resDataStats = JSON.parse(resp.data.data).stats;
        if (resDataStats.passes === resDataStats.tests && resDataStats.tests > 0) {
          res.status(200).json(resp.data);
        } else {
          res.status(200).json(resp.data); 
        }
      }
    })  
    .catch(err => {
    console.error(err);
    });
});

// eventually we will want Object.keys(namespaces)
router.get('/lobbies', (req, res) => {
  res.json(Object.keys(namespaces))
});

module.exports = router;
