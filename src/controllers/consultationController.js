const { Consultation, Message, User } = require('../models');

exports.startConsultation = async (req, res) => {
  try {
    const { subject, firstMessage } = req.body;
    // Pasien memulai diskusi, sistem auto-assign ke admin pertama yang aktif
    const admin = await User.findOne({ where: { role: 'admin', isActive: true } });
    if (!admin) return res.status(400).json({ message: 'Tidak ada admin tersedia untuk menerima diskusi' });

    const consultation = await Consultation.create({
      patientId: req.user.id, adminId: admin.id,
      subject, lastMessageAt: new Date(),
    });
    if (firstMessage) {
      await Message.create({
        consultationId: consultation.id, senderId: req.user.id,
        text: firstMessage, messageType: 'pertanyaan',
      });
    }
    res.status(201).json({ consultation });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memulai diskusi', error: err.message });
  }
};

exports.getMyConsultations = async (req, res) => {
  const where = req.user.role === 'admin' ? { adminId: req.user.id } : { patientId: req.user.id };
  const consultations = await Consultation.findAll({
    where,
    include: [
      { model: User, as: 'patient', attributes: ['id', 'name'] },
      { model: User, as: 'admin', attributes: ['id', 'name'] },
    ],
    order: [['lastMessageAt', 'DESC']],
  });
  res.json({ consultations });
};

exports.getMessages = async (req, res) => {
  const messages = await Message.findAll({
    where: { consultationId: req.params.consultationId },
    include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
    order: [['createdAt', 'ASC']],
  });
  res.json({ messages });
};

exports.getQaTable = async (req, res) => {
  const messages = await Message.findAll({
    where: { consultationId: req.params.consultationId },
    include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
    order: [['createdAt', 'ASC']],
  });
  const questions = messages.filter((m) => m.messageType === 'pertanyaan');
  const answers = messages.filter((m) => m.messageType === 'jawaban');
  const rows = questions.map((q) => {
    const answer = answers.find((a) => a.answeredQuestionId === q.id);
    return {
      questionId: q.id,
      question: q.text,
      questionAttachment: q.attachmentUrl,
      askedAt: q.createdAt,
      answer: answer ? answer.text : null,
      answerAttachment: answer ? answer.attachmentUrl : null,
      answeredAt: answer ? answer.createdAt : null,
      answeredBy: answer ? answer.sender?.name : null,
    };
  });
  res.json({ rows });
};

exports.sendMessage = async (req, res) => {
  try {
    const { text, attachmentUrl } = req.body;
    const consultation = await Consultation.findByPk(req.params.consultationId);
    if (!consultation) return res.status(404).json({ message: 'Diskusi tidak ditemukan' });

    let messageType = 'info';
    let answeredQuestionId = null;
    if (req.user.role === 'pasien') {
      messageType = 'pertanyaan';
    } else if (req.user.role === 'admin') {
      const lastUnanswered = await Message.findOne({
        where: { consultationId: consultation.id, messageType: 'pertanyaan' },
        order: [['createdAt', 'DESC']],
      });
      if (lastUnanswered) {
        const alreadyAnswered = await Message.findOne({ where: { answeredQuestionId: lastUnanswered.id } });
        if (!alreadyAnswered) { messageType = 'jawaban'; answeredQuestionId = lastUnanswered.id; }
      }
    }

    const message = await Message.create({
      consultationId: consultation.id, senderId: req.user.id,
      text, attachmentUrl, messageType, answeredQuestionId,
    });
    consultation.lastMessageAt = new Date();
    await consultation.save();

    const io = req.app.get('io');
    if (io) io.to(`consultation_${consultation.id}`).emit('new_message', message);
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengirim pesan', error: err.message });
  }
};

exports.closeConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.consultationId);
    if (!consultation) return res.status(404).json({ message: 'Diskusi tidak ditemukan' });
    consultation.status = 'selesai';
    await consultation.save();
    res.json({ consultation });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menutup diskusi', error: err.message });
  }
};
