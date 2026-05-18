# P3 Route Evidence Status Report

Phase 1 verification artifact. This report does not mutate route metadata or begin region correction.

## Normalized Runtime Distribution

- Total P3 questions: 396
- routeEvidence.status counts: `{"ambiguous-route": 19, "clean": 317, "review-only": 60}`
- validatedRegionId count: 317
- displayRegionId-only count: 26
- fallback-display-only count: 0
- no displayRegionId count: 53

## Route Report Distribution

- source route counts: `{"ambiguous_multi_topic_route": 14, "missing_p3_route": 53, "review_needed_route": 12, "safe_p3_route": 317, "total_p3_route_records": 396}`
- normalized status by route-report category: `{"ambiguous_multi_topic_route": {"ambiguous-route": 14}, "missing_p3_route": {"review-only": 53}, "review_needed_route": {"ambiguous-route": 5, "review-only": 7}, "safe_p3_route": {"clean": 317}}`
- route-queue fallback display-only items: 53
- queue items: 233

## Count Differences

- clean minus safe routes: 0
- missing-route minus missing routes: -53
- ambiguous-route minus ambiguous routes: 5
- review-only minus review-needed routes: 48

## Explanation

- Runtime clean and route-report safe now align exactly.
- The 53 route-report missing_p3_route records are not runtime missing-route records after route stamping because their sidecar review reasons make them review-only; in the projected normalized bank they have no displayRegionId.
- Runtime ambiguous-route is broader than route-report ambiguous_multi_topic_route because ambiguous review reasons are stamped ambiguous even when the queue category is missing_p3_route or review_needed_route.
- Runtime review-only is broader than route-report review_needed_route because unresolved review reasons on missing primary routes are preserved as review-only instead of being downgraded to fallback display.
- The route-correction queue still lists raw-bank fallback placements for the 53 missing routes as correction aids; those are not runtime fallback-display-only routeEvidence records.
- Queue item totals are not route-status totals because the queue also includes text review, deferred mark-scheme evidence, and support-content gaps.

## Display-Only Breakdown

- displayRegionId-only by status: `{"ambiguous-route": 19, "review-only": 7}`
- displayRegionId-only by region: `{"algebra-forge": 1, "calculus-cliffs": 2, "complex-harbor": 1, "differential-shrine": 2, "integration-gardens": 14, "numerical-mines": 5, "trig-observatory": 1}`
- fallback-display-only by region: `{}`
