import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const existentFile = await File.findByPk(req.body.file_id);
    if (!existentFile) {
      return res
        .status(400)
        .json({ error: 'You are trying associate a banner that not exists!' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res
        .status(400)
        .json({ error: 'Creation of past meetups is not permited' });
    }
    const user_id = req.userId;
    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { idMeetup } = req.params;
    const existentMeetup = await Meetup.findByPk(idMeetup);
    if (!existentMeetup) {
      return res
        .status(404)
        .json({ error: `Meetup with id: ${idMeetup} not found` });
    }
    if (existentMeetup.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: "Is not permitted edit other user's meetup" });
    }
    if (existentMeetup.past) {
      return res
        .status(401)
        .json({ error: 'Is not permitted edit past meetups' });
    }
    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(401).json({ error: 'Meetup date invalid' });
    }
    existentMeetup.update(req.body);
    return res.json(existentMeetup);
  }

  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);
      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
        {
          model: File,
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(meetups);
  }

  async delete(req, res) {
    const { idMeetup } = req.params;
    const meetup = await Meetup.findByPk(idMeetup);
    if (!meetup) {
      return res
        .status(404)
        .json({ error: `Meetup with id: ${idMeetup} not found` });
    }
    if (meetup.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: "Can't delete other user's meetups" });
    }

    if (meetup.past) {
      return res.status(401).json({ error: "Can't delete past meetups" });
    }

    await meetup.destroy();
    return res.send();
  }
}

export default new MeetupController();
