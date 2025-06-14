function classifyUserRequest(message) {

  const lowerMsg = message.toLowerCase();

  const metadataKeywords = [
    "what tables", "list tables", "table list", "show tables",
    "database schema", "what data", "structure", "columns", "fields"
  ];

  const isMetadataRequest = metadataKeywords.some(keyword => lowerMsg.includes(keyword));

  if (isMetadataRequest) return 'metadata';
  if (message.trim().length === 0) return 'empty';

  return 'query';
}

module.exports = classifyUserRequest;
