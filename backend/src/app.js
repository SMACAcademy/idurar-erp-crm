require('dotenv').config();
const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/mainAppApi');
const publicAppApiRouter = require('./routes/appRoutes/publicAppApi');
const paymentPublicApiRouter = require('./routes/appRoutes/paymentPublicApi');
const referencePublicApiRouter = require('./routes/appRoutes/referencePublicApi');
const invoicePublicApiRouter = require('./routes/appRoutes/invoicePublicApi');
 
const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// // default options
// app.use(fileUpload());

// Here our API Routes

app.use('/api', coreAuthRouter);

// Public (no-auth) Payment endpoints under /api/payment/*
// Must be registered BEFORE the protected routers so they bypass adminAuth
app.use('/api', paymentPublicApiRouter);
 
// Public (no-auth) reference tables: PaymentMode and Taxes (list all)
app.use('/api', referencePublicApiRouter);

// Public (no-auth) invoice email endpoint
app.use('/api', invoicePublicApiRouter);
 
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);
app.use('/public-api', publicAppApiRouter);
 
// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
