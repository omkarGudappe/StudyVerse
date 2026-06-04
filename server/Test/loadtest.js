import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
export const options = {
  vus: 100,
  duration: '30s',
};

const BASE_URL = 'https://studyverse-megv.onrender.com/api/posts';
const TEST_ID = '68bfec6b6994a336b142b86f';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmZlYzZiNjk5NGEzMzZiMTQyYjg2ZiIsImlhdCI6MTc2MDI2MjgwMCwiZXhwIjoxNzYwODY3NjAwfQ.NS6eWSjyujCEeH8wyd1HgXZgnp_ZkjgDICyx-EUQMQg';

export default function () {
  const res = http.get(`${BASE_URL}/${TEST_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
