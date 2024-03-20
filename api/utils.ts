export function stringSort(arr: any[], prop: string, inverse: boolean) {
	arr.sort((a, b) => {
		if (a[prop] < b[prop]) {
			return inverse ? 1 : -1;
		}
		if (a[prop] > b[prop]) {
			return inverse ? -1 : 1;
		}
		return 0;
	});
}

export function intSort(arr: any[], prop: string, inverse: boolean) {
	arr.sort((a, b) => {
		return inverse ? a[prop] - b[prop] : b[prop] - a[prop];
	});
}

export function dateSort(arr: any[], prop: string, inverse: boolean) {
	arr.sort((a, b) => {
		const aComp = new Date(a[prop]).getTime();
		const bComp = new Date(b[prop]).getTime();

		return inverse ? aComp - bComp : bComp - aComp;
	});
}

/** CRUD for tasks */
export function reduceIntoAssociativeArray(
	source: any[],
	key: string,
	deleteKey = false
) {
	let res;

	try {
		res = source.reduce((agg, item) => {
			if (item && item[key]) {
				const clonedItem = { ...item };

				if (deleteKey) {
					delete clonedItem[key];
				}

				agg[item[key]] = clonedItem;
			}

			return agg;
		}, {});
	} catch (e) {
		console.warn(e);

		res = source;
	}

	return res;
}

/** General helpers */
/** Various time units as seconds */
export enum SecondsIn {
	minute = 60,
	hour = 60 * 60,
	day = 60 * 60 * 24,
	month = 60 * 60 * 24 * 30,
	year = 60 * 60 * 24 * 30 * 12,
}

export enum ShortTimeNames {
	minute = 'm',
	hour = 'h',
	day = 'd',
	month = 'mo',
	year = 'y',
}

export type TimeUnit = 'minute' | 'hour' | 'day' | 'month' | 'year';

export function secondsToHumanReadable(seconds: number, short = false) {
	let res = `${seconds} ${short ? 's' : 'seconds'}`;

	Object.keys(SecondsIn).forEach((x: string) => {
		if (seconds > SecondsIn[x as TimeUnit]) {
			if (seconds > 2 * SecondsIn[x as TimeUnit]) {
				res = `${Math.floor(seconds / SecondsIn[x as TimeUnit])} ${
					short ? ShortTimeNames[x as TimeUnit] : `${x}s`
				}`;
			} else {
				res = short ? `1 ${ShortTimeNames[x as TimeUnit]}` : `a ${x}`;
			}
		}
	});

	return res;
}

export function timeSince(time: number) {
	const diff = Math.floor((Date.now() - time) / 1000);

	if (diff > 0) {
		return `${secondsToHumanReadable(diff)} ago`;
	} else {
		return `in ${secondsToHumanReadable(-diff)}`;
	}
}

export function loopToNextInArray<T = any>(
	currentVal: T,
	arr: T[],
	offset = 0
) {
	if (!arr?.length) return undefined;

	const currentIndex = arr.findIndex((x) => x === currentVal);

	if (currentIndex < 0) return arr[0];

	const targetIndex = (currentIndex + offset + 1) % arr.length;

	return arr[targetIndex];
}

export function handleError(data: {
	message: string;
	notify?: boolean;
	throw?: Error;
	error?: any;
}) {
	if (data.notify) {
		// Send a notification to admins
	}
	// Log the error
	if (data.message) console.warn('ERROR text:', data.message);
	if (data.error) console.warn(data.error);

	if (data.throw) {
		throw data.throw;
	}
}
