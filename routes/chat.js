const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { OpenAI } = require('openai');

const config = require('../config/dbConfig');
const classifyUserRequest = require('../utils/classifyUserRequest');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/chat', async (req, res) => {

  const userMessage = req.body.message;
  const requestType = classifyUserRequest(userMessage);

  const { message } = req.body;

  if (requestType === 'metadata') {
    return res.json({
      type: 'text',
      response: `
      The database contains the following tables:
      1. **Categories** – Stores info about Pokemon Categories (ID, Name).
      2. **Countries** – Stores info about Countries (Id, Name).
      3. **Owners** – Stores info about Pokemon Owners (Id, FirstName, LastName, Gym. CountryId).
      4. **Pokemon** – Stores info about Pokemons (Id, Name, BirthDate).
      5. **PokemonCategories** – Stores info about Pokemons and their Categories (PokemonId, CategoryId).
      6. **PokemonOwners** – Stores info about Pokemon Owners (Id, OwnerId).
      7. **Reviewers** – Stores info about Pokemon Reviewers (Id, Title, Text, Rating, PokemonId).
      8. **Reviews** – Stores info about Pokemon Reviews (Id, Title, Text, Rating, PokemonId).
      `
    });
  }

  if (requestType === 'empty') {
    return res.json({
      type: 'text',
      response: "I didn’t catch that. Could you please ask a question about the database or what you're trying to find?"
    });
  }

  try {
    const aiPrompt = `
      You are a chatbot assistant that helps query a Microsoft SQL Server database.

      ## Tabels:

      1. **dbo.Categories**
        - Id (int)
        - Name (varchar)

      1. **dbo.Countries**
        - Id (int)
        - Name (varchar)

      3. **dbo.Owners**
        - Id (int)
        - FirstName (varchar)
        - LastName (varchar)
        - Gym (varchar)
        - CountryId (int)

      4. **dbo.Pokemon**
        - Id (int)
        - Name (varchar)
        - BirthDate (datetime)

      5. **dbo.PokemonCategories**
        - PokemonId (int)
        - CategoryId (int)

      6. **dbo.PokemonOwners**
        - PokemonId (int)
        - OwnerId (int)

      6. **dbo.Reviewers**
        - Id (int)
        - FirstName (varchar)
        - LastName (varchar)

      6. **dbo.Reviews**
        - Id (int)
        - Title (varchar)
        - Text (varchar)
        - Rating (int)
        - ReviewerId (int)
        - PokemonId (int)

      Assume that CountryId in Owners refers to Id in Countries.
      Assume that PokemonId in PokemonCategories refres to Id in Pokemon.
      Assume that CategoryId in PokemonCategories refers to Id in Categories.
      Assume that PokemonId in PokemonOwners refers to Id in Owners.
      Assume that ReviewerId in Reviews refers to Id in Reviewers.
      Assume that PokemonId in Reviews refers to Id in Pokemon.

      ## Instructions:

      - If the user request is about **listing tables**, **describing the database**, or **asking what data is available**, reply with a **simple plain-text response** explaining the available tables and their columns.
      - If the user asks a **specific data question**, return a **single valid SQL query** to answer it. Use **column aliases** in the \`SELECT\` clause to make output readable (e.g., \`e_name AS EmployeeName\`).
      - Wrap the query in triple backticks using the \`sql\` tag.
      - After the query, provide a brief **natural language explanation** of what the query does.

      User request: "${message}"
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI assistant that helps query a SQL Server database.' },
        { role: 'user', content: aiPrompt },
      ],
    });

    const content = completion.choices[0].message.content;
    console.log("AI response:\n", content);

    const sqlMatch = content.match(/```sql\n([\s\S]*?)```/);
    if (!sqlMatch) {
      return res.status(400).json({ error: 'No SQL query found in AI response.', content });
    }

    const query = sqlMatch[1];
    console.log("Running query:\n", query);

    await sql.connect(config);
    const result = await sql.query(query);

    res.json({ data: result.recordset, explanation: content.replace(sqlMatch[0], '').trim() });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
