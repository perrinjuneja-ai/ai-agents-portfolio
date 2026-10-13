Context

As a Senior Developer strictly create an HTML page for testcase generator with customized UI not embedding langflow chat CDN

Instructions:
1) Strictly DO NOT use below langflow cdn for chat
<script src="https://cdn.jsdelivr.net/gh/langflow-ai/langflow-embedded-chat@main/dist/build/static/js/bundle.min.js"></script>
2) Mandatorily chat UI should be custom built calling the Langflow API
3) Chat UI should have the option for cleary and copy
4) Generated testcases should be exported in the excel with below format
TC ID|Description|Steps|Expected Result|Priority
5) UI should have a description of the Testcase Generator
6) Toggle for Dark and Light theme
7) UI should have sample user stories for Banking, Finance and Insurance domains
8) Chatbot name should be "Siri"
9) Welcome message should be "Happy to help you in Testcase generation"
10) Error message should be in red
11) Chat should always be opened by default
12) Placeholder for the chat window should be -- "Am Siri here! type your message"

13)Use below API -- API Baseurl, flow id, API key and model should be configurable in the script file with no hardcoding in the html

HTTP Method - Post
Endpoint - http://localhost:7860/api/v1/run/2908c40a-7632-4c5e-a0e2-4c2f8a997452
Baseurl-http://localhost:7860/api/v1/run
Flow ID-2908c40a-7632-4c5e-a0e2-4c2f8a997452
API Key - <Add own Langflow API key>



Request body
{
		           "output_type": "chat",
		           "input_type": "chat",
		           "input_value": "Generate Fund Transfer Testcases",
		           "tweaks": {
		             "GroqModel-jKsdU": {
		               "model_name": "openai/gpt-oss-120b"
		             }
		           },
		           "session_id": "YOUR_SESSION_ID_HERE"
		         }