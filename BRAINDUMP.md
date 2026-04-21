# BRAINDUMP — Frontend

## Goal

Kill the manual “claim your club and we’ll get back to you” flow for the normal happy path.

A club coordinator should be able to land on the site, understand the offer instantly, pay right there, create their club account, get dropped into an admin setup flow, configure the pool, publish it, and start collecting entries without waiting on me to manually touch anything.

This is not just a checkout change. It is a full conversion flow rewrite from brochure + lead form into product + account + provisioning + setup.

---

## What the current UI is doing wrong

The current page is acting like a nice marketing shell around a manual sales process.

What it says now:
- pricing
- claim your club
- fill out form
- we will set you up later

What it needs to say:
- choose a plan
- pay now
- create your club
- launch your pool today

Right now the UI is implying self-serve but the interaction is still basically “leave your info and wait.” That gap kills trust and momentum.

Main friction points:
- CTA says **Claim Your Club** but the result is not actually claiming anything
- no visible path to immediate account creation
- no plan comparison around what happens after purchase
- no confidence that setup is instant
- form fields are too generic and look like a contact form, not product onboarding
- there is no step-by-step mental model of what the user gets next
- it feels like I am the workflow instead of the software being the workflow

---

## Product framing shift

The entire frontend should shift from **lead capture** to **self-serve provisioning**.

New user mental model:
1. Pick a plan
2. Pay
3. Create club admin account
4. Set up this season or tournament
5. Open entries
6. Share club link
7. Watch leaderboard and manage the pool

The experience should feel like:
- simple
- serious
- trustworthy
- fast
- not startup fluffy
- not enterprise blochure nonsense
- very clear that this is purpose-built for club pool operators

---

## Frontend information architecture

### Public marketing / conversion pages

#### 1. Landing / pricing page
This page should answer:
- what this is
- who it is for
- how fast it works
- what formats are supported
- what happens after payment
- why someone should trust it for a live event pool

Sections I would want:
- Hero: run your club pool without spreadsheet chaos
- Trust/value bullets
- Pricing cards
- What happens after signup
- Supported pool formats
- FAQ
- Final CTA

#### 2. Checkout entry page
This is where plan intent becomes transaction intent.

Needs:
- selected plan summary
- exactly what is included
- tournament support language
- billing cadence clarity
- refund/cancellation expectations if any
- “You’ll create your club and admin account right after payment”

#### 3. Post-purchase onboarding flow
This is the real replacement for the current claim form.

Should be a structured wizard, not one long page.

Suggested steps:
1. Club details
2. Admin account creation
3. First pool setup
4. Review + launch
5. Success / next steps

#### 4. Club admin area
Once they are in, this should be the minimal control center.

Top priorities:
- current subscription / plan state
- club profile
- active pools
- create pool
- open/close entries
- entry export
- leaderboard access
- settings

This does not need to be bloated initially. It just needs to be clean and trustworthy.

---

## Pricing page changes

The pricing cards need to stop ending in a fake CTA.

### Current CTA problem
“Claim Your Club” sounds like the club is being provisioned immediately, but the next screen is basically a request form.

That is a mismatch.

### Better CTA options
For self-serve:
- Start Single Pool
- Start Annual Plan
- Buy Single Pool
- Start Your Club
- Get Started

### Pricing card improvements
Each card should clearly state:
- what they are buying
- who it is for
- what unlocks instantly
- whether admin access is immediate
- whether they can run one event or ongoing events
- any branding limits
- support expectations

### Example structure

**Single Pool**
- $199 one-time
- Run one tournament pool end-to-end
- Includes club admin setup
- Unlimited entries
- Leaderboard + exports
- Best for one major or one hosted event

CTA: **Buy Single Pool**

**Year of Weekly Pools**
- $499/year
- Unlimited pools for 12 months
- Includes club admin account
- All supported pool formats
- Branding and priority support
- Best for clubs running recurring contests

CTA: **Start Annual Plan**

### Nice addition
Add a small 3-step strip under pricing:
- Pay online
- Set up your club
- Launch entries today

That alone reframes the whole thing.

---

## Checkout UX

The checkout flow should be dead simple.

### Required principles
- no giant form before payment
- no unnecessary fields at checkout
- no setup details mixed into billing step
- no tournament configuration before account exists unless used as optional prefill
- keep focus on conversion

### Ideal checkout data collected pre-payment
- selected plan
- email
- payment info
- maybe club name if useful for receipts / prefill

Everything else can happen after.

### Post-payment redirect
After successful payment:
- create or finalize customer record
- redirect to onboarding
- preserve plan context
- preserve purchase status
- protect against refresh / double completion issues

The UI should clearly say:
- Payment complete
- Let’s set up your club
- This takes a few minutes

---

## Onboarding wizard

This is where the current manual form gets replaced.

### Step 1: Club details
Fields:
- Club name
- Public club slug / subdomain preview
- Contact email
- Optional logo upload later, not required here
- Maybe location/timezone if relevant

Needs:
- slug availability check
- clean validation
- obvious examples
- ability to edit later

### Step 2: Admin account
Fields:
- first name
- last name
- email
- password or magic link depending on auth approach

Important:
- if checkout email is the same, prefill it
- make this feel like activation, not another application form

### Step 3: First pool setup
This should be very guided.

Fields / controls:
- tournament
- pool format
- pick count
- counting picks
- whether buckets are enabled
- if bucketed, number of buckets and picks per bucket
- entry cap if supported
- entry open date
- entry lock date/time
- visibility rules
- tiebreaker options if applicable

This step should branch based on format selection, not dump every possible field at once.

### Step 4: Review
Show a very clean summary:
- plan
- club
- admin email
- first pool type
- entry rules
- schedule

Buttons:
- back
- create club and launch pool

### Step 5: Success
Show:
- admin dashboard button
- public entry link
- copy link
- add another pool
- view billing
- invite another coordinator later if supported

---

## Pool setup UX philosophy

This is where the product can either feel sharp or instantly become confusing.

### Hard rule
Do not expose all possible config knobs at once.

Most club coordinators do not want a software product. They want:
- “run our Masters pool”
- “run our weekly pick format”
- “use buckets”
- “only count best 5”
- “lock when tournament starts”

So the UI needs progressive disclosure.

### Approach
Start with presets:
- Straight pick format
- Bucketed format
- Weekly tour format
- One major template

Then let advanced settings expand underneath.

### Example setup structure

#### Pool basics
- Pool name
- Tournament
- Time zone
- Entry window
- Public or invite-only

#### Format
- Format type
- Total picks required
- Counting picks
- Tiebreak rules

#### Bucket settings
Only shown if bucketed:
- number of buckets
- golfers per bucket source if applicable
- one pick per bucket or custom
- whether manual bucket edits are allowed

#### Entry settings
- max entries per person
- entry naming rules
- whether email is required
- whether CSV import is allowed for admin

#### Publishing
- draft / published
- scheduled open
- preview public form

---

## Admin dashboard UX

Need a clean first usable dashboard. Not enterprise control panel junk.

### The first version should prioritize
- one obvious “Create Pool” action
- one obvious view of current pools
- one obvious view of plan/subscription status
- one obvious public link for entries
- basic stats

### Dashboard modules
- Club summary
- Subscription / billing status
- Active pools
- Draft pools
- Recent entries
- Leaderboard quick link
- Export actions

### Pool cards should show
- pool name
- tournament
- format
- status: draft / open / locked / live / final
- entries count
- public link
- manage button

### Management actions
- edit config
- duplicate pool
- open entries
- close entries
- export entries
- archive

---

## Public entry experience

This matters just as much as admin setup because the coordinator is going to judge the whole product by what their members see.

### Public entry page needs
- clear club branding
- pool title
- format explanation in plain English
- entry form that feels modern and not hacked together
- lock time shown clearly
- validation that prevents bad submissions
- confirmation state that feels trustworthy

### For bucketed entries
Need to make it impossible to misunderstand:
- which bucket they are picking from
- how many picks they need
- whether they are done
- whether entry can be edited later

### For straight pick entries
Need:
- searchable player list
- selected count clearly visible
- “you need 7 total, best 5 count” style helper text
- lock and tournament info always visible

---

## Conversion and trust enhancements

This product is handling money-adjacent coordination and event trust. The UI needs to act like that.

### Add confidence builders
- “Setup takes a few minutes”
- “Your club gets its own admin access and pool link immediately”
- “Run one event or a full season”
- “Built for real club pools, not generic forms”

### Potential trust strip
- Unlimited entries
- Live leaderboard
- CSV export
- Club-specific admin access

### FAQ topics
- When do I get access?
- Can I run more than one pool?
- What formats are supported?
- Can I export entries?
- Can I use my own club branding?
- What happens after I pay?
- Can I duplicate a pool next week?

---

## Frontend technical flow

### Core flow
1. User selects plan
2. Frontend creates checkout session
3. User pays
4. Frontend receives success state via redirect
5. Frontend loads onboarding bootstrap state
6. User completes club + account + first pool setup
7. Frontend submits provisioning request
8. Club dashboard loads

### Required frontend state handling
- plan selection state
- authenticated vs unauthenticated onboarding
- post-checkout recovery state
- partially completed wizard state
- provisioning status
- subscription status
- slug availability state
- tournament catalog / pool format config metadata

### Must handle well
- refresh during onboarding
- checkout success page revisits
- expired or invalid provisioning link
- duplicate email
- existing club slug conflict
- payment succeeded but onboarding not completed
- onboarding partially completed and resumed later

---

## Frontend pages / routes I would expect

### Public
- `/`
- `/pricing`
- `/checkout/:plan`
- `/signup/success`
- `/faq`

### Auth / onboarding
- `/onboarding`
- `/onboarding/club`
- `/onboarding/account`
- `/onboarding/pool`
- `/onboarding/review`

### Club admin
- `/club`
- `/club/pools`
- `/club/pools/new`
- `/club/pools/:poolId`
- `/club/settings`
- `/club/billing`

### Public club pages
- `/c/:clubSlug`
- `/c/:clubSlug/:poolSlug`
- `/c/:clubSlug/:poolSlug/enter`
- `/c/:clubSlug/:poolSlug/leaderboard`

Whether it is path-based or subdomain-based can be decided later, but the mental model should be baked into the frontend copy early.

---

## Components / UI system work

This is a good place to get disciplined now so we do not build spaghetti forms.

### Reusable components needed
- pricing card
- plan comparison row
- stepper / wizard shell
- field group
- conditional config section
- tournament selector
- pool format selector
- bucket configuration editor
- schedule / lock time picker
- review summary card
- public entry builder
- empty states
- success states
- billing status pill
- pool status pill

### Design direction
- clean golf-adjacent / club-adjacent premium feel
- not cheesy sports betting aesthetics
- not generic SaaS blue soup
- comfortable whitespace
- serious buttons and forms
- strong hierarchy
- mobile usable even if desktop-first

---

## Validation and guardrails in the UI

The frontend should prevent obvious bad configurations before they hit the backend.

Examples:
- counting picks cannot exceed total picks
- bucket totals must line up with pick requirements
- lock date must make sense for selected tournament
- annual plan users can create multiple pools; single pool users should understand their limits
- draft pool cannot be published without required fields
- slug must be available before continue
- duplicate public URLs should be blocked early

The setup flow should not require the user to understand underlying schema. It should translate business intent into valid config.

---

## Edge cases the frontend should explicitly support

- payment succeeded, onboarding was abandoned
- user bought single pool and wants to configure it later
- user bought annual plan and wants to create first pool tomorrow
- club admin wants to edit branding after launch
- pool is created in draft and opened later
- user accidentally closes browser mid-setup
- one person buys, another person needs admin rights later
- coordinator wants to duplicate last week’s format
- a club wants both bucketed and straight-pick pools under one subscription

---

## Analytics and conversion tracking

If we are rebuilding this flow, we should know where it dies.

Track:
- pricing page viewed
- plan selected
- checkout started
- checkout completed
- onboarding started
- club details completed
- account created
- pool setup completed
- first pool published
- public entry link viewed
- first entry submitted

This is the exact funnel that will tell us where the product is still acting manual or confusing.

---

## MVP recommendation

### Phase 1
Get self-serve working for the normal path:
- pricing
- checkout
- account creation
- club creation
- one pool setup wizard
- publish
- public entry page
- admin dashboard basics

### Leave for later
- team member invitations
- advanced branding
- multiple admin roles
- deep reporting
- crazy edge-case pool configuration UI
- discounts / promo codes unless really needed
- white-label polish beyond logo/colors
- complex multi-event scheduling

---

## Frontend acceptance criteria

### Conversion
- user can pay without manual outreach
- user is told exactly what happens after payment
- successful payment leads into onboarding immediately

### Onboarding
- user can create a club and admin account in one guided flow
- user can configure first pool with tournament + type + config
- review step clearly summarizes setup before launch

### Admin
- club admin lands in a usable dashboard
- first pool can be managed without support help
- public pool link is easy to find and share

### Public entry
- end users can understand format quickly
- forms validate clearly
- submission confirmation feels trustworthy

### Product trust
- no dead-end “request access” form in the happy path
- UI copy consistently reinforces instant access and self-serve setup

---

## Open frontend questions

These need decisions, but they should not block architecture.

- Are we using path-based club URLs first or real subdomains immediately?
- Do we want password auth, magic links, or both for club admins?
- Should checkout require login first or create auth after payment?
- How much branding control belongs in MVP?
- Can a single annual account manage multiple simultaneous pools from day one?
- Do we allow club coordinators to duplicate prior pool templates immediately?
- Do we want one onboarding wizard for all plans or a slightly different one for single-pool vs annual?

---

## My bias / recommendation

The frontend should bias hard toward:
- fewer steps
- clearer handoffs
- guided setup
- draft then publish
- template-first configuration
- serious trust-building copy
- obvious success states

Biggest principle:
do not make the user feel like they are applying for access to a service I manually run.

They should feel like they just bought software made exactly for this job, and now they are in control.
