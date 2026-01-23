const express = require('express');
const axios = require('axios');

const router = express.Router();

// Proxy all /containers requests to container-service
router.use('/', async (req, res) => {
  try {
    const url = `http://container-service:3002${req.originalUrl}`;
    const response = await axios({
      method: req.method,
      url,
      headers: { ...req.headers, host: 'container-service' },
      data: req.body,
      params: req.query,
      validateStatus: () => true,
    });
    res.status(response.status).set(response.headers).send(response.data);
  } catch (err) {
    console.error('Gateway proxy error:', err.message || err);
    res.status(502).json({ message: 'Bad Gateway' });
  }
});

module.exports = router;
