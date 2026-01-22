import express, { Application } from 'express'

import tenantsRoute from './routes/tenantsRoute';

const app: Application = express();
app.use(express.json());
app.use('/api/tenants',tenantsRoute);
export default app;