import { gql } from 'graphql-request';

export const GitHubUserData = gql`
	query GITHUB_USER_DATA_QUERY($username: String!) {
		user(login: $username) {
			repositories(last: 100, isFork: false, orderBy: { field: UPDATED_AT, direction: ASC }) {
				nodes {
					name
					description
					url
					updatedAt
					languages(first: 5) {
						nodes {
							color
							name
						}
					}
				}
			}
		}
	}
`;


// {
//   "username": "spences10",
//   "year":"2019-01-01T00:00:00.000Z"
// }
// query GITHUB_USER_CONTRIBUTIONS($username: String!, $year: DateTime!) {
//   user(login: $username) {
//     contributionsCollection(from: $year) {
//       contributionCalendar {
//         totalContributions
//         weeks {
//           contributionDays {
//             color
//             contributionCount
//             date
//             weekday
//           }
//         }
//       }
//     }
//   }
// }

// query GITHUB_USER_REPOSITORIES($username: String!) {
//   user(login: $username) {
//     repositories(
//       last: 20
//       isFork: false
//       orderBy: {field: UPDATED_AT, direction: ASC}
//       privacy: PUBLIC
//     ) {
//       nodes {
//         name
//         description
//         url
//         updatedAt
//         languages(first: 5) {
//           nodes {
//             color
//             name
//           }
//         }
//       }
//     }
//   }
// }

// query GITHUB_USER_DATA_QUERY($username: String!) {
//   user(login: $username) {
//     repositories(
//       last: 100
//       isFork: false
//       orderBy: {field: UPDATED_AT, direction: ASC}
//       privacy: PUBLIC
//     ) {
//       nodes {
//         name
//         description
//         url
//         updatedAt
//         languages(first: 5) {
//           nodes {
//             color
//             name
//           }
//         }
//       }
//     }
//     contributionsCollection {
//       contributionCalendar {
//         totalContributions
//         weeks {
//           contributionDays {
//             color
//             contributionCount
//             date
//             weekday
//           }
//         }
//       }
//     }
//   }
// }