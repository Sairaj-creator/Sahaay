// TensorFlow.js MobileNet — maps ImageNet labels → Sahaay modes
// Model weights (~20 MB) are fetched from the TF.js CDN on first use
// Dynamic imports keep TF.js out of the initial bundle

let model = null

const LABEL_MAP = {
  currency: ['banknote', 'paper money', 'wallet', 'purse', 'piggy bank'],
  face:     ['face', 'person', 'man', 'woman', 'boy', 'girl', 'human face', 'head'],
  ocr:      ['book', 'notebook', 'envelope', 'menu', 'newspaper', 'comic book', 'signboard'],
}

function labelsToMode(predictions) {
  for (const pred of predictions) {
    const label = pred.className.toLowerCase()
    for (const [mode, keywords] of Object.entries(LABEL_MAP)) {
      if (keywords.some(kw => label.includes(kw))) return mode
    }
  }
  return 'scene'
}

export async function classifyMode(videoElement) {
  if (!model) {
    const [tfMod, mnMod] = await Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/mobilenet'),
    ])
    await tfMod.ready()
    model = await mnMod.load({ version: 2, alpha: 0.5 })
  }
  const predictions = await model.classify(videoElement, 3)
  return labelsToMode(predictions)
}
