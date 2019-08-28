import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import NewSubscribeMail from '../jobs/NewSubscribeMail';
import User from '../models/User';

class SubscriptionController {
  async store(req, res) {
    const { idMeetup } = req.body;
    const meetupToBeSubscribed = await Meetup.findByPk(idMeetup);
    if (!meetupToBeSubscribed) {
      return res.status(404).json({ error: 'Meetup not find' });
    }

    const subscribeUser = await User.findByPk(req.userId);
    const ownerUser = await User.findByPk(meetupToBeSubscribed.user_id);

    if (subscribeUser.id === meetupToBeSubscribed.user_id) {
      return res
        .status(401)
        .json({ error: 'Cannot subscribe to yourself meetup' });
    }

    if (meetupToBeSubscribed.past) {
      return res.status(401).json({ error: 'Cannot subscribe to past meetup' });
    }

    const meetupAlreadySubscribed = await Subscription.findOne({
      where: {
        user_id: subscribeUser.id,
        meetup_id: idMeetup,
      },
    });
    if (meetupAlreadySubscribed) {
      return res.status(401).json({ error: 'Meetup already subscribed!' });
    }
    const anyMeetupAtSameTime = await Subscription.findOne({
      where: {
        user_id: subscribeUser.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetupToBeSubscribed.date,
          },
        },
      ],
    });
    if (anyMeetupAtSameTime) {
      return res.status(401).json({
        error: 'Cannot subscribe to more than one meetup at same time',
      });
    }
    const subscription = await Subscription.create({
      meetup_id: idMeetup,
      user_id: req.userId,
    });
    const infosToSendMail = {
      nameOwner: ownerUser.name,
      emailOwner: ownerUser.email,
      nameRegistered: subscribeUser.name,
      emailRegistered: subscribeUser.email,
      meetupTitle: meetupToBeSubscribed.title,
      meetupDate: meetupToBeSubscribed.date,
    };
    await Queue.add(NewSubscribeMail.key, { infosToSendMail });

    return res.json(subscription);
  }

  async index(req, res) {
    const user_id = req.userId;
    const subscriptions = await Subscription.findAll({
      where: {
        user_id,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });
    return res.json(subscriptions);
  }
}

export default new SubscriptionController();
