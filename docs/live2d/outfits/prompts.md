# Vollständige Generierungsprompts

Werkzeug: eingebautes `image_gen.imagegen`, `transparent_background: true`.
Edit-Referenz für alle drei Aufrufe: `docs/live2d/references/luna-fullbody-study-v1.png`.

## summer.png

Use case: identity-preserve. Create one full-body summer outfit character illustration for the existing Luna avatar, based exactly on the reference character. Preserve her original youthful anime Ragdoll catgirl face, deep blue eyes, silver cream bob hair, cat ears, modest proportions, small smile, front-facing neutral stance with arms slightly apart, fingers relaxed and feet fully visible. Change clothing only: loose modest pale sky-blue short sleeved cotton shirt with small embroidered crescent moon, high round neckline, untucked hip-length hem; cream loose calf-length summer trousers; simple cream canvas sneakers. Fully opaque practical age-appropriate clothing. Keep identical illustration rendering, delicate thin lines, softly shaded fabric, same camera and proportions. No tail, no accessories on face, no text, no watermark, no backdrop, genuine transparent alpha. This is one isolated complete character art reference, not a sheet or collage.

## winter.png

Use case: identity-preserve. One complete full-body winter outfit illustration of exactly the Luna avatar in the reference. Preserve face identity, deep blue eyes, cream silver bob hair and Ragdoll ears, original modest youthful proportions, small smile, delicate anime linework, soft painterly shading, neutral front-facing stance with relaxed arms slightly apart and fingers visible. Change only clothing: practical hip-length dusty blue winter coat with cream shearling collar and cuffs, closed front with simple buttons, a small cream knitted scarf close around neck ending above chest (no long loose ends), dark straight trousers, ankle winter boots with cream trim. Outfit fully opaque, loose, modest, age-appropriate. Keep head unobstructed, no hat. Whole body and shoes visible with comfortable margins. Genuine transparent background. No text, watermark, scenery, collage or extra characters. Artwork reference for a future Live2D outfit; preserve anatomy and keep separate arms easy to identify.

## bath.png

Use case: identity-preserve. Create ONE wholesome full-body after-bath clothing reference for the Luna anime Ragdoll catgirl avatar in the reference. Preserve exactly the reference face, deep blue eyes, cream silver bob hair, ears, original modest youthful proportions, neutral front-facing standing pose, arms slightly away from torso with hands relaxed, small friendly smile and delicate softly shaded anime rendering. Clothing: thick fully opaque cream terrycloth bathrobe, high overlapping closed neckline, securely tied waist, long sleeves, below-knee length, simple pale blue trim and matching closed-toe slippers. A small folded pale blue hand towel draped over one shoulder provides the requested towel element. Hair dry as reference. No wet sheen, no translucency, no exposed torso, no cleavage, no sensual posing. Comfortable practical age-appropriate lounge clothing. Entire figure including feet, no cropping, genuinely transparent background, no text or watermark or scenery. This is a single isolated outfit art reference for a future animated rig.

## winter-body.png — verdecktes Körpermaterial

Eingebautes imagegen-Werkzeug, `transparent_background: true`, Referenz `winter.png`.

Technical Live2D material edit. Edit this exact 1024x1536 winter character image, preserving original canvas coordinates, scale, head, coat torso, scarf/collar, trousers and shoes exactly. Remove BOTH ENTIRE ARMS from shoulder down, including sleeves, cuffs, wrists and hands. Replace the removed outer arm areas with fully transparent alpha. Complete ONLY the small hidden areas of the blue coat torso that were previously overlapped by the sleeves/cuffs: clean continuous blue coat side edges from shoulder to hem. Keep coat buttons and pockets identical and in the same places. The torso coat must have natural closed shoulder ends, and NO dangling sleeves or cuffs at the hips. This is a technical body-only layer for an animation rig, intentionally armless, not a new character pose. Keep entire remaining figure in exactly its old pixel position, do not centre or resize, do not crop. No scenery, labels or added items. Genuine transparent alpha.
