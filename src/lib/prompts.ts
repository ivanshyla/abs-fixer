type GenerationParams = {
    strength: number;
    guidance_scale: number;
    num_inference_steps: number;
};

export type PromptContext = {
    subject?: string;
    pose?: string;
    outfit?: string;
    environment?: string;
    referenceHint?: string;
};

type PromptConfig = {
    goal: string;
    preserve: string[];
    change: string[];
    avoid: string[];
    negativePrompt?: string;
    generation?: GenerationParams;
};

const promptConfigs: Record<string, PromptConfig> = {
    natural_fit: {
        goal: 'Subtly refine the abdominal area so the subject appears naturally fit with approximately 18-20% body fat while keeping the original realism.',
        preserve: [
            'Existing lighting, shadows, camera perspective, and lens characteristics',
            'Skin tone, freckles, pores, and small imperfections',
            'Clothing, accessories, hands, and background elements'
        ],
        change: [
            'Blend very soft abdominal definition with realistic transitions between muscles',
            'Introduce gentle shading that suggests tone without pushing to athletic levels',
            'Respect natural skin elasticity and keep highlights matte instead of glossy'
        ],
        avoid: [
            'Hard-edged six-pack separation or bodybuilding appearance',
            'Specular, plastic, or airbrushed skin treatments',
            'Changing subject identity, body fat distribution, or outfit color'
        ],
        negativePrompt: 'bodybuilder, hyper defined abs, plastic skin, CGI, wax figure, different person, changed outfit, HDR bloom, extreme shadows, sharpened contours'
    },
    athletic: {
        goal: 'Portray the subject with visible but believable abdominal musculature similar to someone who trains consistently at the gym (roughly 12-15% body fat).',
        preserve: [
            'Original lighting setup and camera framing',
            'Natural subsurface scattering, pores, and fine skin details',
            'Identity, hairstyle, outfit fit, and environment'
        ],
        change: [
            'Carve subtle but readable ab lines, obliques, and serratus without overemphasis',
            'Add soft vascular hints only when they match the original lighting',
            'Keep shoulders, chest, and arms proportional to the new core tone'
        ],
        avoid: [
            'Cartoonish anatomy or shrink-wrapped skin',
            'Spray-tan hues, oil shine, or HDR effects',
            'Adding sweat, gym props, or new accessories'
        ],
        negativePrompt: 'cartoon abs, over sharpened definition, oil skin, fake tan, bodybuilding stage, gym equipment, sweat drops, different lighting'
    },
    defined: {
        goal: 'Show a fitness-enthusiast physique with clearly separated abs around 10-12% body fat while staying photorealistic.',
        preserve: [
            'True-to-life skin micro-details and tonal variation',
            'Original camera crop, wardrobe, and environment',
            'Natural color grading and dynamic range'
        ],
        change: [
            'Deepen muscle separation with believable highlights and shadows',
            'Emphasize core functionality by detailing obliques and upper abs evenly',
            'Leave subtle veins or dryness only where appropriate for the subject'
        ],
        avoid: [
            'Unnatural belly-button warping or stretched textures',
            'Extreme vascularity, competition tan, or glossy sheen',
            'Altering limb proportions or facial fullness'
        ],
        negativePrompt: 'competition tanning oil, dehydrated skin, hyperreal render, body swap, distorted torso, extra limbs, clothing change'
    },
    weight_loss_5: {
        goal: 'Depict a realistic 5 kg (≈11 lbs) fat-loss progression with conservative visual changes across the entire body.',
        preserve: [
            'Lighting, skin tone, texture, and all environmental elements',
            'Subject identity, hairstyle, and expression',
            'Clothing design, color, and fabric behaviour'
        ],
        change: [
            'Slightly slimmer face with a clearer jawline and gentle cheekbone hint',
            'Reduce abdominal bloating, giving a flatter midsection and slightly looser clothing',
            'Trim arms and neck area while keeping natural skin elasticity and folds'
        ],
        avoid: [
            'Adding muscle definition or six-pack separation',
            'Overly dramatic weight change or “different person” outcome',
            'Skin smoothing, retouching, or makeup adjustments'
        ],
        negativePrompt: 'six pack abs, gym body, muscular, beauty filter, smoothed skin, plastic surgery, new outfit, different person, lighting change',
        generation: {
            strength: 0.65,
            guidance_scale: 4.0,
            num_inference_steps: 35
        }
    },
    weight_loss_10: {
        goal: 'Visualize a notable but attainable 10 kg (≈22 lbs) fat-loss transformation with proportional reductions across the body.',
        preserve: [
            'Original skin tonality, freckles, and fine wrinkles',
            'Lighting direction, exposure, and color balance',
            'Wardrobe, hair, background, and camera perspective'
        ],
        change: [
            'Slim the waist and torso with visible narrowing at the midsection',
            'Create slimmer limbs and a longer-looking neck with defined collarbones',
            'Emphasize decreased facial puffiness and a more angular jaw without changing identity'
        ],
        avoid: [
            'Muscle gain or bodybuilding aesthetics',
            'Surgical-looking alterations or lifted features',
            'Altering ethnicity, age markers, or facial proportions'
        ],
        negativePrompt: 'bodybuilder, muscle gain, surgery scars, smoothed face, beauty filter, makeup, different ethnicity, extreme gauntness, outfit change',
        generation: {
            strength: 0.65,
            guidance_scale: 4.0,
            num_inference_steps: 35
        }
    },
    ozempic: {
        goal: 'Show six months of GLP-1 (Ozempic/Wegovy) weight loss with noticeable fat depletion patterns typical for the medication.',
        preserve: [
            'Pose, framing, clothing, and environment',
            'Skin tone, lighting, and any moles, freckles, or scars',
            'Overall identity and facial expression'
        ],
        change: [
            'Reduce facial volume significantly, revealing pronounced cheekbones and jawline',
            'Highlight slight skin laxity around jaw and neck due to rapid fat loss',
            'Slim arms, legs, and torso with more prominent collarbones and shoulder structure'
        ],
        avoid: [
            'Adding muscle tone or athletic cues',
            'Airbrushing wrinkles or volume-depletion effects',
            'Changing hairstyle, makeup, or accessories'
        ],
        negativePrompt: 'healthy plump skin, muscular, gym tone, filler, botox, smooth skin filter, weight gain, bloated face, beauty retouch',
        generation: {
            strength: 0.65,
            guidance_scale: 4.0,
            num_inference_steps: 35
        }
    },
    six_months_running: {
        goal: 'Portray the subject after six months of consistent endurance running with subtle whole-body leanness and posture confidence.',
        preserve: [
            'Original wardrobe, footwear, and accessories',
            'Skin texture, facial features, and hair',
            'Lighting conditions and background elements'
        ],
        change: [
            'Slightly leaner torso, hips, and arms with gentle definition in calves and quads',
            'Encourage upright, relaxed posture typical of a distance runner',
            'Let clothing drape a touch looser while keeping fabrics identical'
        ],
        avoid: [
            'Extreme fat loss or marathon-race emaciation',
            'Adding sweat, medals, or new gear',
            'Changing the face, pose, or environment dramatically'
        ],
        negativePrompt: 'sprinter muscles, extreme leanness, sweat, race bib, gear change, different outfit, anime proportions, harsh shadows'
    },
    six_months_climbing: {
        goal: 'Reflect six months of regular climbing with functional upper-body strength and grip-ready hands, staying grounded in realism.',
        preserve: [
            'Clothing style, color, and fabric texture',
            'Lighting, skin tone, freckles, and blemishes',
            'Facial identity, hairstyle, and background context'
        ],
        change: [
            'Enhance forearm tendons and a slightly broader upper back/shoulders',
            'Tighten core stability with engaged obliques but no exaggerated six-pack',
            'Optionally hint at chalk dust on hands without adding props'
        ],
        avoid: [
            'Massive muscle gain or bodybuilder symmetry',
            'Adding climbing gear, harnesses, or new textures',
            'Over-smoothing skin or changing outfit design'
        ],
        negativePrompt: 'bodybuilder lats, harness, rope, helmet, gym background, sweaty palms, plastic skin, cartoon muscles'
    },
    six_months_gym: {
        goal: 'Show balanced progress from six months of structured gym training with noticeable muscle fullness yet attainable results.',
        preserve: [
            'Subject identity, hair, expression, and skin characteristics',
            'Camera perspective, lighting, and color grading',
            'Outfit cut, seams, and accessories'
        ],
        change: [
            'Add modest chest, shoulder, and arm development with proportional legs',
            'Slightly reduce body fat while keeping a realistic off-season look',
            'Introduce controlled abdominal tone without stage-level dryness'
        ],
        avoid: [
            'Competition-level definition or tanning oil shine',
            'Changing outfit fit dramatically or adding gym props',
            'Warping anatomy, hands, or facial proportions'
        ],
        negativePrompt: 'stage tan, shredded bodybuilder, shiny skin, gym props, different clothes, distorted limbs, hyperreal render'
    }
};

const formatList = (items: string[]) => items.map((item) => `- ${item}`).join('\n');

const buildContextDirectives = (context: PromptContext) => {
    const directives = [
        context.subject || 'Keep the same subject identity, age, gender, and ethnicity.',
        context.pose
            ? `Maintain the existing pose (${context.pose}) and camera framing.`
            : 'Maintain the existing pose and camera framing.',
        context.outfit
            ? `Outfit stays exactly the same (${context.outfit}); only adjust fit if noted.`
            : 'Keep clothing identical; only adjust how it drapes if noted.',
        context.environment
            ? `Preserve the environment/background (${context.environment}) without new props.`
            : 'Preserve the original environment and avoid adding props.'
    ];
    return directives.filter(Boolean);
};

const formatPrompt = (config: PromptConfig, context: PromptContext = {}) => {
    const sections = [
        `Goal:\n${config.goal}`,
        `Context:\n${formatList(buildContextDirectives(context))}`,
        `Maintain:\n${formatList(config.preserve)}`,
        `Adjust:\n${formatList(config.change)}`,
        `Avoid:\n${formatList(config.avoid)}`
    ];

    if (context.referenceHint) {
        sections.push(`Reference Guidance:\n- Use reference "${context.referenceHint}" to anchor proportions and lighting.`);
    }

    return sections.join('\n\n');
};

const getConfig = (type: string): PromptConfig => promptConfigs[type] || promptConfigs.natural_fit;

const getDefaultGeneration = (intensity: number): GenerationParams => ({
    strength: Math.min(1, Math.max(0.1, 0.1 + (intensity / 100) * 0.9)),
    guidance_scale: 2.5,
    num_inference_steps: 25
});

export const getPromptForAbsType = (absType: string, context?: PromptContext) =>
    formatPrompt(getConfig(absType), context);

export const getNegativePrompt = (absType: string) => getConfig(absType).negativePrompt || '';

export const getGenerationParams = (type: string, intensity: number = 50) =>
    getConfig(type).generation || getDefaultGeneration(intensity);
