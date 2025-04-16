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
const erpApiRouter = require('./routes/appRoutes/appApi');

const fileUpload = require('express-fileupload');
const queryRoutes = require('./routes/query.routes');

// Feature Routes
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const aiRoutes = require('./routes/ai.routes');
const paymentModeRoutes = require('./routes/paymentMode.routes');
const taxesRoutes = require('./routes/taxes.routes');
// const invoiceRoutes = require('./routes/invoice.routes');
// const quoteRoutes = require('./routes/quote.routes');
// const paymentRoutes = require('./routes/payment.routes');
// const settingRoutes = require('./routes/setting.routes');

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
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

// Feature Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/paymentMode', paymentModeRoutes);
app.use('/api/taxes', taxesRoutes);
// app.use('/api/invoice', invoiceRoutes);
// app.use('/api/quote', quoteRoutes);
// app.use('/api/payment', paymentRoutes);
// app.use('/api/setting', settingRoutes);
app.use('/api/query', queryRoutes);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
