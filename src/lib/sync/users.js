import localforage from 'localforage';
import axios from 'axios';
import { users, userError } from '$lib/store';

export const usersSync = async () => {
	// get users from local
	await localforage
		.getItem('users')
		.then(async function (value) {
			// get users from API if initial sync
			if (!value) {
				try {
					const response = await axios.get('https://api.btcmap.org/v2/users');

					if (response.data.length) {
						// filter out deleted users
						const usersFiltered = response.data.filter((user) => !user['deleted_at']);

						// set response to local
						localforage
							.setItem('users', response.data)
							.then(function (value) {
								// set response to store
								users.set(usersFiltered);
							})
							.catch(function (err) {
								users.set(usersFiltered);
								userError.set(
									'Could not store users locally, please try again or contact BTC Map.'
								);
								console.log(err);
							});
					} else {
						userError.set(
							'Users API returned an empty result, please try again or contact BTC Map.'
						);
					}
				} catch (error) {
					userError.set('Could not load users from API, please try again or contact BTC Map.');
					console.log(error);
				}
			} else {
				// filter out deleted users
				const usersFiltered = value.filter((user) => !user['deleted_at']);

				// load users locally first
				users.set(usersFiltered);

				// start update sync from API
				try {
					const response = await axios.get(
						`https://api.btcmap.org/v2/users?updated_since=${value[0]['updated_at']}`
					);

					// update new records if they exist
					let newUsers = response.data;

					// check for new users in local and purge if they exist
					if (newUsers.length) {
						let updatedUsers = value.filter((value) => {
							if (newUsers.find((user) => user.id === value.id)) {
								return false;
							} else {
								return true;
							}
						});

						// add new users
						updatedUsers.forEach((user) => {
							newUsers.push(user);
						});

						// filter out deleted users
						const newUsersFiltered = newUsers.filter((user) => !user['deleted_at']);

						// set updated users locally
						localforage
							.setItem('users', newUsers)
							.then(function (value) {
								// set updated users to store
								users.set(newUsersFiltered);
							})
							.catch(function (err) {
								userError.set(
									'Could not update users locally, please try again or contact BTC Map.'
								);
								console.log(err);
							});
					}
				} catch (error) {
					userError.set('Could not update users from API, please try again or contact BTC Map.');
					console.error(error);
				}
			}
		})

		.catch(function (err) {
			userError.set('Could not load users locally, please try again or contact BTC Map.');
			console.log(err);
		});
};