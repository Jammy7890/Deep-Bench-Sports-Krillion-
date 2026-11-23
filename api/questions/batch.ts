import {
  handleQuestionsBatch,
  type ApiRequest,
  type ApiResponse,
} from '../../server/sportsReferee.ts';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  return handleQuestionsBatch(req, res);
}
