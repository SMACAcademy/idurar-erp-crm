import app from "./app";
import { ENV } from "./config/env";

app.listen(ENV.PORT, () => {
  console.log(`Server running on http://localhost:${ENV.PORT} in ${ENV.NODE_ENV} mode`);
});
