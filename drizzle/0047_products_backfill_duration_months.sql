UPDATE `products` SET `duration_months` = max(1, CAST(round(CAST(`duration_days` AS REAL) / 30.0) AS INTEGER));
