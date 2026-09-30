# Configurable Cost Model

CivicFlow compares estimated operational cost for independent handling with coordinated incident handling. Rules cover dispatch, travel per kilometer, labor per hour, inspection, material, average labor hours, and average travel distance.

The defaults are illustrative assumptions, not actual government expenditure. A `CostRule` document can replace them without code changes. Coordinated handling shares dispatch, travel, and inspection and caps shared labor at three work units for the estimate. The API labels every response as configurable estimated operational cost.