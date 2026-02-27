import User from '../models/User.js';

export const enrollVoice = async (req, res) => {
  try {
    const { passphrase } = req.body;

    if (!passphrase) {
      return res.status(400).json({ success: false, message: 'Passphrase is required' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      voicePassphrase: passphrase.toLowerCase().trim(),
    });

    res.status(200).json({ success: true, message: 'Voice enrolled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const verifyVoice = async (req, res) => {
  try {
    const { spokenText } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.voicePassphrase) {
      return res.status(400).json({
        success: false,
        message: 'No voice passphrase found. Please enroll first.',
      });
    }

    const spoken = spokenText.toLowerCase().trim();
    const stored = user.voicePassphrase.toLowerCase().trim();

    // Calculate how many words match
    const spokenWords = spoken.split(' ');
    const storedWords = stored.split(' ');
    const matchingWords = spokenWords.filter(word => storedWords.includes(word)).length;
    const matchScore = matchingWords / storedWords.length;

    // 60% word match = verified
    const verified = matchScore >= 0.85;

    res.status(200).json({
      success: true,
      verified,
      score: matchScore,
      message: verified ? 'Voice verified' : 'Voice not recognized',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};