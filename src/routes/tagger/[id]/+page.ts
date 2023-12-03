import { error } from '@sveltejs/kit';
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 3 });

// @ts-expect-error
export async function load({ params }) {
	const { id } = params;

	const response = await axios.get(`https://api.btcmap.org/v2/users/${id}`);

	const data = response.data;

	if (data) {
		return { user: data.id, username: data['osm_json']['display_name'] };
	}

	throw error(404, 'User Not Found');
}