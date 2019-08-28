import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class NewSubscribeMail {
  get key() {
    return 'NewSubscribeMail';
  }

  async handle({ data }) {
    const {
      nameOwner,
      emailOwner,
      nameRegistered,
      emailRegistered,
      meetupTitle,
      meetupDate,
    } = data.infosToSendMail;

    await Mail.sendMail({
      to: `${nameOwner} <${emailOwner}>`,
      subject: 'Novo inscrito em uma de suas Meetups',
      template: 'newsubscriber',
      context: {
        nameOwner,
        nameRegistered,
        emailRegistered,
        meetupTitle,
        meetupDate: format(
          parseISO(meetupDate),
          "'dia' dd 'de' MMMM 'às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new NewSubscribeMail();
