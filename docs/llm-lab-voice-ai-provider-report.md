# LLM Lab Voice AI Provider Report

Research date: 2026-04-30

This report compares the ElevenLabs-style voice AI offerings from 15 major AI labs and hyperscalers, plus ElevenLabs as the benchmark. The focus is text-to-speech, voice cloning or custom voices, dubbing or speech-to-speech, and real-time voice agents.

Cost is the primary selection factor. Independence from vendor lock-in is the second factor.

## Executive Summary

The cheapest published text-to-speech APIs are no longer the obvious ElevenLabs-style specialists. xAI now advertises Grok TTS at USD $4.20 per 1 million characters, which is near the same raw character price as legacy AWS Polly and Google Standard/WaveNet voices. That is the current lowest-cost headline option, but it has only five fixed voices and is not yet a full ElevenLabs replacement for cloning, dubbing, and rich studio workflows.

For an ElevenLabs-like product that includes voice cloning, Mistral Voxtral TTS is the most interesting new entrant: USD $16 per 1 million characters, zero-shot voice cloning from a short prompt, streaming, and open weights for experimentation. The catch is that the open weights are CC BY-NC 4.0, so commercial self-hosting still requires care or a commercial arrangement.

For lowest operational risk and easier provider switching, AWS Polly, Google Cloud Text-to-Speech, Azure Speech, and IBM Text to Speech remain useful. They are less exciting than ElevenLabs for creator workflows, but they are mature, stable, and easier to swap because they mostly expose plain TTS APIs.

For Chinese-language, Asian-region, or cost-sensitive multilingual work, Alibaba Qwen/CosyVoice and Tencent Cloud are strong on published price. Alibaba is especially compelling because it combines low API prices with an open-source CosyVoice ecosystem, but the product has region, voice, and data-residency caveats.

Anthropic, DeepSeek, and Meta do not currently provide a directly comparable commercial ElevenLabs-style TTS API. Anthropic has consumer voice mode but no public developer TTS product. DeepSeek remains text/API focused. Meta has research/open speech models such as SeamlessM4T, but it is not a commercial hosted TTS provider.

## Normalisation

Where possible, costs are normalised to USD per 1 million input characters of synthesized text.

For token or minute priced services:

- OpenAI states `gpt-4o-mini-tts` is about USD $0.015 per minute. AWS uses 1 million characters as about 23 hours and 8 minutes of speech in its Polly examples, so that maps to roughly USD $20.82 per 1 million characters.
- Google Gemini TTS is token-priced. Using the same 23h08m duration and Google's 25 audio tokens per second explanation gives a rough effective price near USD $21 per 1 million characters for Gemini 2.5 Flash TTS. Use Google's own calculator for production.

Currency and region notes:

- Cloud prices are generally US list prices unless noted.
- Chinese cloud pricing is region-specific and sometimes published only in Chinese. I mark lower-confidence estimates where official English pricing was not cleanly available.
- Voice cloning, custom voice training, dubbing, and real-time agents often have separate charges beyond base TTS.

## Cost Ranking

| Rank | Provider | Lowest useful published TTS price | ElevenLabs-like depth | Lock-in risk | Verdict |
| --- | --- | ---: | --- | --- | --- |
| 1 | xAI Grok TTS | USD $4.20 / 1M characters | Low-medium: fixed voices, not full clone/dubbing suite | Medium-high | Cheapest simple TTS if five voices are enough. |
| 2 | AWS Polly Standard | USD $4 / 1M characters | Low: mature TTS, no ElevenLabs-style cloning workflow | Medium-low | Cheapest conservative cloud baseline. |
| 3 | Google Standard/WaveNet | USD $4 / 1M characters | Low-medium: many voices, strong cloud stack | Medium | Good low-cost baseline, but premium voices cost more. |
| 4 | Alibaba Qwen/CosyVoice | About USD $10-$26 / 1M characters | Medium-high: TTS, voice conversion, voice enrolment, open CosyVoice ecosystem | Medium | Very strong cost/features if region/procurement fit. |
| 5 | Tencent Cloud TTS | About USD $12.50-$18.50 / 1M characters | Medium: broad voice catalogue and styles | Medium-high | Good price, but China-cloud lock-in and procurement complexity. |
| 6 | OpenAI TTS | USD $15 / 1M characters for older TTS; mini TTS about USD $20.82 equivalent | Medium: expressive model TTS, not voice-cloning suite | Medium | Strong API and quality, weaker for cloning/dubbing. |
| 7 | Mistral Voxtral TTS | USD $16 / 1M characters | High: zero-shot voice cloning, streaming, multilingual | Medium | Best ElevenLabs-like lab entrant if licensing and language coverage fit. |
| 8 | AWS Polly Neural | USD $16 / 1M characters | Low-medium: stable neural TTS, generative tier extra | Medium-low | Safe, mature, easy to swap later. |
| 9 | Azure AI Speech | About USD $16 / 1M characters for neural TTS | Medium: custom neural voice, containers, enterprise controls | Medium-low | Strong enterprise choice with better deployment options. |
| 10 | IBM Text to Speech | About USD $20 / 1M characters | Medium: custom brand voice and deploy-anywhere options | Medium-low | Less trendy, but good portability posture. |
| 11 | Google Chirp/Gemini TTS | About USD $21-$30 / 1M character equivalent; custom voices more | Medium-high: high-quality cloud voices and Gemini audio generation | Medium | Best if already using Google Cloud/Gemini. |
| 12 | ElevenLabs benchmark | Roughly USD $50-$100+ / 1M characters by API tier/model, with subscriptions/credits | Very high: cloning, dubbing, agents, studio UX | High | Best product depth, not cheapest at scale. |
| 13 | MiniMax Speech | About USD $60-$100 / 1M characters | High: expressive speech, voice cloning, audio models | Medium-high | Strong quality challenger, cost is not the advantage. |
| 14 | ByteDance Volcano/Doubao | Public price confidence low; indicative Chinese pricing can land much higher than AWS/Google | High in China ecosystem | High | Interesting only if Doubao/Volcano ecosystem is strategic. |
| 15 | Baidu AI Cloud | Public price confidence low; promotional/unit pricing varies by Chinese product tier | Medium | High | Could be low-cost in China, but hard to recommend for global app work. |
| 16 | Meta | No commercial hosted TTS API price | Research/open model depth, not SaaS product | License-dependent | Useful for research, not a direct ElevenLabs replacement. |
| 17 | Anthropic | No public developer TTS API | Consumer voice only, not ElevenLabs equivalent | N/A | Not a candidate for this requirement today. |
| 18 | DeepSeek | No public developer TTS API | None found | N/A | Not a candidate for this requirement today. |

## Provider Notes

### ElevenLabs Benchmark

ElevenLabs is the product-depth benchmark: text-to-speech, voice cloning, voice changer, dubbing, sound effects, conversational AI/agents, studio tooling, and creator-friendly workflows.

Cost is its weakness. Its subscription/credit structure can be attractive for low volume, but at high automated volume it is usually more expensive than cloud TTS APIs. It is also one of the highest lock-in options because voices, agents, dubbing workflows, and project assets tend to live inside the ElevenLabs ecosystem.

Best use: highest-quality voice cloning, dubbing, and creator workflows where quality matters more than per-character cost.

### OpenAI

OpenAI offers TTS through the audio/speech APIs, including `tts-1`, `tts-1-hd`, and the newer `gpt-4o-mini-tts`. Pricing is competitive for mainstream developer TTS: USD $15 per 1 million characters for `tts-1`, USD $30 for `tts-1-hd`, and about USD $0.015 per minute for `gpt-4o-mini-tts`.

Strengths:

- Strong developer experience.
- Good quality and low latency.
- Can combine speech with broader OpenAI agent/app workflows.

Weaknesses:

- Not a full ElevenLabs-like cloning/dubbing platform.
- Proprietary voices and API.
- Less vendor-independent if the app also depends on OpenAI models elsewhere.

Best use: app narration, assistant responses, generated coaching summaries, and voice UX where cloning is not required.

### Google

Google has several overlapping voice paths: Cloud Text-to-Speech, premium Chirp voices, custom voices, and Gemini TTS through Vertex AI. The low end can be as cheap as USD $4 per 1 million characters for Standard/WaveNet-style pricing. Neural2 is typically USD $16 per 1 million characters, Chirp 3 HD is around USD $30, and Studio/custom voice paths are higher.

Strengths:

- Mature cloud APIs.
- Very broad language/voice catalogue.
- Strong if already using Google Cloud or Gemini.

Weaknesses:

- Pricing varies by voice class.
- Custom voice and premium voices increase lock-in.
- Not as creator-friendly as ElevenLabs for cloning/dubbing.

Best use: reliable multilingual TTS and enterprise cloud deployment.

### AWS

AWS Polly remains one of the clearest low-cost baselines. Standard voices are USD $4 per 1 million characters, neural voices USD $16, generative voices USD $30, and long-form USD $100. AWS also has newer speech-to-speech/agent work through Bedrock/Nova Sonic, but Polly is the closest simple ElevenLabs comparison.

Strengths:

- Low cost.
- Mature cloud ops.
- Broad service integration.
- Lower switching risk than most voice-specialist platforms.

Weaknesses:

- Voice cloning and dubbing depth is not ElevenLabs-level.
- Best experience assumes AWS ecosystem.

Best use: cost-sensitive production TTS where cloning is not required.

### Microsoft Azure

Azure AI Speech is a strong enterprise TTS stack with neural voices, custom neural voice, personal voice features, speech translation, and container/disconnected deployment options in some tiers. Public pricing is region/currency driven, but neural TTS is commonly listed around USD $16 per 1 million characters.

Strengths:

- Enterprise controls.
- Custom voice workflow.
- Containers and disconnected deployment options improve independence.
- Good fit if the club/school ecosystem is already Microsoft-oriented.

Weaknesses:

- Custom voice and enterprise controls can become procurement-heavy.
- Public pricing can be harder to compare because Azure pages are dynamic and region-dependent.

Best use: enterprise voice, custom voice, and compliance-heavy deployments.

### xAI

xAI's Grok TTS is the surprise cost leader in this scan: USD $4.20 per 1 million characters, with five named voices and a simple text-to-speech endpoint. Voice agents are also priced separately at USD $3 per hour.

Strengths:

- Extremely cheap for simple TTS.
- Straightforward API pricing.
- Useful if fixed voices are acceptable.

Weaknesses:

- Not a full ElevenLabs-style voice cloning/dubbing product.
- Early ecosystem compared with AWS/Google/Azure/OpenAI.
- High vendor lock-in if relying on Grok-specific voices or agent stack.

Best use: low-cost generated voice where voice cloning and studio tooling are not required.

### Mistral

Mistral Voxtral TTS is a serious ElevenLabs-style contender. It supports zero-shot voice cloning from a short prompt, streaming, multilingual voices, and a USD $16 per 1 million character API price. Open weights are available for research/experimentation, but the public open-weight license is CC BY-NC 4.0, which is not commercial-friendly without additional terms.

Strengths:

- Low price for cloning-capable TTS.
- Open-weight path for experimentation.
- Strong vendor-independence story if commercial licensing is available.

Weaknesses:

- Newer product.
- Language coverage and quality need testing.
- Non-commercial open-weight licence limits direct commercial self-hosting.

Best use: pilot against ElevenLabs for cloned/expressive voice where cost matters.

### MiniMax

MiniMax Speech models are high-quality and ElevenLabs-like in ambition, with speech models such as Speech-02 Turbo/HD and voice cloning. Published API pricing is much higher than the cheapest providers, around USD $60-$100 per 1 million characters depending on model class.

Strengths:

- Strong expressive speech.
- Voice cloning support.
- Good fit for demos, creators, and app voice personas.

Weaknesses:

- Not cheap at scale.
- Proprietary model/API.

Best use: quality-focused voice experiments where ElevenLabs needs a challenger.

### Alibaba

Alibaba Cloud Model Studio / DashScope offers Qwen and CosyVoice speech models with very competitive pricing. Public rates include Qwen3 TTS Flash around USD $0.10 per 10,000 characters, Qwen3 TTS VC around USD $0.115 per 10,000 characters, and CosyVoice Flash tiers around USD $0.13-$0.26 per 10,000 characters. That puts useful TTS around USD $10-$26 per 1 million characters.

Strengths:

- Strong cost.
- CosyVoice open-source ecosystem improves technical independence.
- Voice enrolment and design are cheap in the public table.

Weaknesses:

- Region, language, and cloud account friction.
- Some model and data terms need careful review.
- International procurement and privacy review may be harder.

Best use: cost-sensitive multilingual/Asian-market TTS, and open-source inspired self-host exploration.

### Tencent

Tencent Cloud Text-to-Speech publishes competitive rates around USD $12.50 per 1 million characters for standard voices and USD $18.50 for premium voices. It offers many voices, styles, and a mature cloud ecosystem.

Strengths:

- Competitive price.
- Broad voice product.
- Good China/Asia coverage.

Weaknesses:

- Less portable for a Western/Australian app stack.
- Procurement, data residency, and support may be more complex.

Best use: China/Asia-region deployments or secondary benchmark.

### IBM

IBM Watson Text to Speech is not flashy, but its pay-as-you-go price around USD $0.02 per thousand characters gives a clean USD $20 per 1 million character baseline. IBM also offers enterprise deployment posture and custom brand voice paths.

Strengths:

- Stable enterprise option.
- Deploy-anywhere messaging is useful for lock-in concerns.
- Clear enough pricing.

Weaknesses:

- Less modern creator tooling.
- Voice quality and cloning depth may lag specialists.

Best use: enterprise TTS where procurement/compliance matter.

### ByteDance

ByteDance/Volcano Engine/Doubao has strong speech synthesis capabilities and likely excellent China-market quality. Public English pricing is not as cleanly accessible as AWS/Google/OpenAI/xAI. Chinese sources and console pricing appear region-specific.

Strengths:

- Strong speech and media AI ecosystem.
- Likely high quality for Chinese and regional voices.

Weaknesses:

- Public price confidence is low.
- Higher procurement and data-residency complexity.
- More vendor lock-in than cloud-neutral APIs.

Best use: only if the product deliberately targets ByteDance/Volcano/Doubao ecosystem.

### Baidu

Baidu AI Cloud has speech synthesis products and appears capable, especially for Chinese-language workflows. However, directly comparable public pricing is difficult to normalise from English sources. Chinese product/pricing pages include promotional and tiered offers that should be treated as low-confidence until confirmed in-console.

Strengths:

- Strong Chinese speech stack.
- Potentially cost-effective in-region.

Weaknesses:

- Harder global procurement.
- Pricing clarity is weaker.
- High lock-in and region complexity.

Best use: Chinese-region due diligence only.

### Meta

Meta has important speech research and open models such as SeamlessM4T, but it does not provide a hosted commercial ElevenLabs-style TTS API. Licensing also matters: many Meta speech models are research or non-commercial licensed.

Strengths:

- Useful research direction.
- Potentially high independence for prototypes if licensing allows.

Weaknesses:

- Not a SaaS provider.
- Commercial use may be blocked by licence.
- Requires self-hosting and ML engineering.

Best use: research and architecture inspiration, not direct production voice vendor.

### Anthropic

Anthropic has Claude voice experiences in consumer products, but no public developer text-to-speech or voice-cloning API comparable to ElevenLabs. It is not a procurement candidate for this requirement today.

### DeepSeek

DeepSeek's public API focus remains text/reasoning models. I did not find a public ElevenLabs-like speech synthesis, voice cloning, or dubbing API. It is not a candidate for this requirement today.

## Recommended Shortlist

If cost is the primary determinant:

1. xAI Grok TTS - cheapest simple TTS, if five fixed voices are enough.
2. AWS Polly Standard/Neural - cheapest conservative cloud path.
3. Alibaba Qwen/CosyVoice - strong price and open-source-adjacent ecosystem if region/procurement fit.
4. Tencent Cloud TTS - good published price, higher procurement friction.
5. OpenAI TTS - good balance of quality, cost, and developer ergonomics.

If ElevenLabs-like cloning is required:

1. Mistral Voxtral TTS - best published price for a cloning-capable lab product.
2. Alibaba CosyVoice/Qwen - worth testing because of price and ecosystem.
3. ElevenLabs - best product depth, likely higher cost and lock-in.
4. MiniMax - strong quality challenger, but not cost-leading.

If vendor independence is the priority:

1. Azure Speech - enterprise and container/disconnected options.
2. AWS Polly - simple mature API, easy to abstract.
3. Google Cloud TTS - simple API, multiple voice classes.
4. Mistral Voxtral - promising open-weight story, but commercial licensing must be checked.
5. IBM Text to Speech - enterprise deploy-anywhere posture.

## Recommendation For Sixth Man

For app-generated coaching summaries, admin narration, accessibility prompts, or voice read-outs, I would start with a provider abstraction that can swap TTS providers. The first two adapters should be:

- OpenAI TTS, because the app is already likely to use OpenAI-style workflows and the developer experience is strong.
- AWS Polly or Google Cloud TTS, because they provide the low-cost fallback and reduce long-term lock-in.

If cloned voices, branded club voices, or parent/player-facing narration become important, test Mistral Voxtral against ElevenLabs with the same scripts. Mistral is the most interesting cost challenger. ElevenLabs remains the strongest complete product, but it should be chosen for quality/workflow, not for cost.

Do not build around Anthropic, DeepSeek, or Meta for this requirement today because they do not offer a comparable hosted commercial product.

## Carry-Forward App Tasks

These items remain active from the Sixth Man workstream and should stay visible:

- Roboflow/open-source video AI: the app now has a cleaner `VIDEO_ANALYSIS_ENDPOINT` contract. The next step is an external adapter skeleton that returns deterministic sample `events` and `stats`, then later adds Roboflow/supervision/RF-DETR/OpenCV inference.
- Browser Use: still blocked by `failed to start codex app-server: The system cannot find the path specified. (os error 3)`. Do not rely on Browser Use until the plugin app-server path is repaired.
- Verification gap: `npm run build` passed, but `deno test supabase/functions/video-job-worker/index.test.ts` could not run because Deno is not installed in this shell.

## Sources

- ElevenLabs pricing: https://elevenlabs.io/pricing
- OpenAI pricing: https://openai.com/api/pricing/
- Google Cloud Text-to-Speech pricing: https://cloud.google.com/text-to-speech/pricing
- Google Gemini Live API / Vertex AI pricing: https://cloud.google.com/vertex-ai/generative-ai/pricing
- AWS Polly pricing: https://aws.amazon.com/polly/pricing/
- Amazon Bedrock pricing / Nova Sonic: https://aws.amazon.com/bedrock/pricing/
- Azure AI Speech pricing: https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/
- xAI pricing: https://docs.x.ai/docs/models
- Mistral pricing: https://mistral.ai/products/la-plateforme#pricing
- Mistral Voxtral announcement/docs: https://mistral.ai/news/voxtral
- MiniMax pricing: https://www.minimax.io/platform/pricing
- Alibaba Cloud Model Studio pricing: https://www.alibabacloud.com/help/en/model-studio/billing-for-model-studio
- Tencent Cloud Text-to-Speech pricing: https://www.tencentcloud.com/document/product/1073/37995
- IBM Watson Text to Speech pricing: https://www.ibm.com/products/text-to-speech/pricing
- ByteDance Volcano Engine speech synthesis: https://www.volcengine.com/product/tts
- Baidu AI Cloud speech synthesis: https://cloud.baidu.com/product/speech
- Meta Seamless Communication / SeamlessM4T: https://ai.meta.com/research/seamless-communication/
- Anthropic docs and pricing: https://docs.anthropic.com/ and https://www.anthropic.com/pricing
- DeepSeek API docs and pricing: https://api-docs.deepseek.com/ and https://api-docs.deepseek.com/quick_start/pricing
