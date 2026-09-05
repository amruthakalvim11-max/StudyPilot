const aiService = require('./src/services/ai.service');
async function test() {
  const result = await aiService.askTutor("hello", {name: "test"}, [], true);
  console.log(JSON.stringify(result));
}
test();
