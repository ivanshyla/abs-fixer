export const getPromptForAbsType = (absType: string) => {
    const prompts: Record<string, string> = {
        natural_fit: 'Subtly enhance the abdominal area with very soft, natural muscle definition. Focus on realistic skin texture, pores, and natural lighting. Avoid plastic or shiny skin. Add gentle shadows to suggest muscle tone without extreme definition. The result should look like an average fit person with 18-20% body fat. Maintain all original skin imperfections and lighting conditions.',
        athletic: 'Create visible but natural abdominal muscles. Focus on realistic anatomy and skin texture. Avoid hyper-realistic or cartoonish definition. The abs should look like a result of regular gym training, not bodybuilding. Body fat around 12-15%. Ensure the skin looks organic with natural subsurface scattering and texture. Match the lighting of the original photo perfectly.',
        defined: 'Add well-defined abdominal muscles with clear separation, but keep the skin texture 100% realistic. Avoid the "shrink-wrapped" look. The muscles should look functional and strong. Body fat around 10-12%. Emphasize natural skin details, veins, and texture to prevent a plastic appearance. The result should look like a fitness enthusiast, not a CGI character.',
        weight_loss_5: `Transform this person showing realistic 5kg (11lbs) weight loss results:
- Slightly slimmer face with more defined jawline and subtle cheekbone visibility
- Reduced bloating around midsection, flatter stomach area
- Slimmer arms with less subcutaneous fat
- More defined neck and collarbone area
- Natural skin texture preserved, same lighting and skin tone
- Subtle reduction in double chin if present
- Clothes fit slightly looser
- Same person, same pose, same background, photorealistic quality
- No muscle definition added, purely fat reduction
- Maintain natural skin elasticity appropriate for this amount of weight loss`,
        weight_loss_10: `Transform this person showing realistic 10kg (22lbs) weight loss results:
- Noticeably slimmer face with defined jawline and visible cheekbones
- Significantly reduced midsection, visible waist narrowing
- Slimmer arms and legs with reduced fat deposits
- Prominent collarbones and more defined neck
- Face appears slightly more angular, reduced facial puffiness
- Double chin significantly reduced or eliminated
- Natural skin with possible very minor skin laxity in problem areas
- Clothes appear loose, body visibly transformed
- Same person, same lighting, photorealistic professional quality
- Body fat percentage reduced by approximately 8-12%
- No artificial muscle enhancement, natural weight loss appearance`,
        ozempic: `Transform this person showing typical GLP-1 medication (Ozempic/Wegovy) weight loss results after 6 months:
- Dramatic facial fat loss: hollow cheeks, very prominent cheekbones, defined jawline
- Characteristic "Ozempic face": slightly gaunt appearance, visible facial bone structure
- Significant reduction in facial volume, especially in cheeks and under-chin area
- Fine lines and wrinkles more visible due to volume loss (do not smooth skin)
- Skin may appear slightly looser, especially around jaw and neck
- Dramatically slimmer body, significant midsection reduction
- Arms and legs noticeably thinner
- Collarbones and shoulder bones more prominent
- Overall appearance of rapid weight loss without muscle preservation
- Skin texture shows signs of volume depletion
- Same person, same pose, photorealistic, clinical accuracy
- Do NOT add fitness or muscle tone - this is medication-based weight loss
- Preserve or slightly emphasize nasolabial folds and under-eye area`
    };
    return prompts[absType] || prompts.natural_fit;
};

export const getNegativePrompt = (absType: string) => {
    const negatives: Record<string, string> = {
        weight_loss_5: `muscle definition, six pack, athletic build, gym body, overly dramatic change, plastic surgery look, different person, changed facial features, smoothed skin, beauty filter, changed lighting`,
        weight_loss_10: `bodybuilder, muscle gain, fitness model, unrealistic transformation, plastic surgery, different person, beauty filter, airbrushed skin, changed bone structure, different ethnicity`,
        ozempic: `healthy glow, plump skin, muscle tone, athletic, fitness, filled face, botox, filler, smooth skin, youthful, weight gain, bloated, healthy fat distribution`
    };
    return negatives[absType] || '';
};

export const getGenerationParams = (type: string, intensity: number = 50) => {
    if (type.startsWith('weight_loss') || type === 'ozempic') {
        return {
            strength: 0.65,
            guidance_scale: 4.0,
            num_inference_steps: 35
        };
    }
    return {
        strength: 0.1 + (intensity / 100) * 0.9, // Default dynamic strength
        guidance_scale: 2.5,
        num_inference_steps: 25
    };
};
