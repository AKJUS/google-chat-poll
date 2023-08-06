import {choiceSection} from './helpers/vote';
import {ICON_URL_48X48} from './config/default';
import {chat_v1 as chatV1} from 'googleapis/build/src/apis/chat/v1';
import {PollProperties, Voter} from './helpers/interfaces';

/**
 * Builds the card header including the question and author details.
 *
 * @param {string} topic - Topic of the poll
 * @param {string} author - Display name of user that created the poll
 * @returns {object} card widget
 */
function cardHeader(topic: string, author: string) {
  return {
    title: topic,
    subtitle: `Posted by ${author}`,
    imageUrl: ICON_URL_48X48,
    imageType: 'CIRCLE',
  };
}

/**
 * Builds the section header if the topic is too long
 *
 * @param {string} topic - Topic of the poll
 * @param {string} author - Display name of user that created the poll
 * @returns {object} card section
 */
function sectionHeader(
    topic: string, author: string): chatV1.Schema$GoogleAppsCardV1Section {
  return {
    widgets: [
      {
        'decoratedText': {
          'text': topic,
          'wrapText': true,
          'bottomLabel': `Posted by ${author}`,
          'startIcon': {
            'altText': 'Absolute Poll',
            'iconUrl': ICON_URL_48X48,
            'imageType': 'SQUARE',
          },
        },
      },
    ],
  };
}

/**
 * Builds the configuration form.
 *
 * @param {object} poll - Current state of poll
 * @param {object} poll.author - User that submitted the poll
 * @param {string} poll.topic - Topic of poll
 * @param {string[]} poll.choices - Text of choices to display to users
 * @param {object} poll.votes - Map of cast votes keyed by choice index
 * @param {object} poll.choiceCreator - Map of cast votes keyed by choice index
 * @param {boolean} poll.anon - Is anonymous?(will save voter name or not)
 * @param {boolean} poll.optionable - Can other user add other option?
 * @returns {object} card
 */
export function buildVoteCard(poll: PollProperties) {
  const sections = [];
  const state = JSON.stringify(poll);

  const votes: Array<Array<Voter>> = Object.values(poll.votes);
  const totalVotes: number = votes.reduce((sum, vote) => sum + vote.length, 0);
  for (let i = 0; i < poll.choices.length; ++i) {
    const creator = poll.choiceCreator?.[i];
    const section = choiceSection(i, poll, totalVotes, state, creator);
    sections.push(section);
  }
  if (poll.optionable) {
    sections.push(
        {
          'widgets': [
            {
              'buttonList': {
                'buttons': [
                  {
                    'text': 'Add Option',
                    'onClick': {
                      'action': {
                        'function': 'add_option_form',
                        'interaction': 'OPEN_DIALOG',
                        'parameters': [],
                      },
                    },
                  },
                ],
              },
            },
          ],
        });
  }
  const card: chatV1.Schema$CardWithId = {
    'cardId': 'unique-card-id',
    'card': {
      sections,
    },
  };
  if (poll.topic.length > 40) {
    const widgetHeader = sectionHeader(poll.topic, poll.author.displayName);
    card.card.sections = [widgetHeader, ...sections];
  } else {
    card.card.header = cardHeader(poll.topic, poll.author.displayName);
  }
  return card;
}
