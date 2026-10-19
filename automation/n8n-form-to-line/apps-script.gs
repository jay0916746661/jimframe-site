const N8N_WEBHOOK_URL = '<YOUR_N8N_WEBHOOK_URL>';

function onFormSubmit(event) {
  if (!event || !event.response) {
    throw new Error('請用 Google 表單的「提交表單時」安裝型觸發條件執行。');
  }

  const answers = event.response.getItemResponses().reduce((result, itemResponse) => {
    result[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
    return result;
  }, {});

  const payload = {
    submittedAt: event.response.getTimestamp().toISOString(),
    name: String(answers['姓名'] || ''),
    amount: Number(answers['金額'] || 0),
    note: String(answers['備註'] || '')
  };

  const response = UrlFetchApp.fetch(N8N_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`n8n webhook 回傳 ${status}：${response.getContentText()}`);
  }
}
