import React, { useEffect, useState } from "react";
import axios from "axios";

const initial_messages = [
  //   {
  //     role: "system",
  //     content: `
  //             Act as a quiz app.
  //             You will be given a word, using that word you have to generate a question with four meaningful options where only one of those options is correct.
  //         `,
  //     type: "internal",
  //   },
  //   { role: "system", content: "You are a helpful assistant. You will be given a word using that word you will generate a question and four options for that question using get-question function", type: "internal" },
  //   {
  //     { role: "system", content: "You are a helpful assistant.\nYou will be given a word using that word you have to generate four options related to that word.\n Note: every option must be unique and have some meaning and only one of those options should be correct", type: "internal" },
  //   {
  //     role: "user",
  //     content: "Generate a list of hundered random words and use get-words function",
  //     type: "message",
  //   },
  {
    role: "system",
    content: `Act as a vocabulary type quiz application you have to provide a random word, and provide four options for that word. One of the options will be the correct answer.
      Once I select an answer, inform me the result. Keep asking me questions until I ask you to stop.
      Now, start with your word.`,
    type: "internal",
  },
  //   {
  //     role: "system",
  //     content: `Act like a question generator app.
  //     You have to generate a random question every time.`,
  //     type:"internal"
  //   },
];

let functions = [
  {
    name: "getQuestion",
    description: "Generates a random question",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Random question",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "get-words",
    description: "Return a string of comma separated hundered random words",
    parameters: {
      type: "object",
      properties: {
        words: {
          type: "string",
          description: "A string of comma separated hundered random words",
          // items:{
          // type:"string",
          // description:"random word"
          // }
        },
      },
      required: ["words"],
    },
  },
  {
    name: "get-question",
    description: "returns a random word every time and four meaningful options for a given word",
    parameters: {
      type: "object",
      properties: {
        word: {
          type: "string",
          description: "generates a random word",
        },
        options: {
          type: "array",
          items: {
            type: "string",
            description: "four options",
          },
        },
      },
      required: ["word", "options"],
    },
  },
  {
    name: "get-answer",
    description: "given an question returns an object of answer",
    parameters: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "correct answer",
        },
      },
    },
  },
];

const QuizApp = () => {
  const [question, setQuestion] = useState(null);
  const [formattedmessage, setFormattedmessage] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [answer, setAnswer] = useState(null);
  const [words, setWords] = useState([]);
  const [messages, setMessages] = useState(initial_messages);
  const [wordsArray, setWordsArray] = useState([]);
  const [counter, setCounter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(null);
  const [keyAdded, setKeyAdded] = useState(false);
  const [error, seterror] = useState(false)

  const getWords = async () => {
    try {
      const body = {
        frequency_penalty: 0,
        max_tokens: 1024,
        model: "gpt-4",
        // model: "gpt-3.5-turbo-16k",
        // model: "gpt-3.5-turbo-0613",
        temperature: 0,
        top_p: 0,
        presence_penalty: 0,
        // stream: true,
        // messages: initial_messages,
        messages: messages
          .filter((message) => message.type === "message" || message.type === "internal")
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
        functions: functions,
        function_call: "auto",
      };

      let resp = await axios.post("https://api.openai.com/v1/chat/completions", body, {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });
      if (resp?.data?.choices && resp.data.choices.length > 0) {
        let msg = resp.data.choices[0].message;
        let formatted_msg = { role: msg.role, type: "message" };
        if (msg.hasOwnProperty("function_call")) {
          if (msg.function_call.name == "get-words") {
            let ques = JSON.parse(msg.function_call.arguments);
            formatted_msg.content = msg.function_call.arguments;
            // setQuestion(ques);
            let words = ques.words;
            words = words.split(",");
            setWordsArray(words);
            // setWords((prev) => {
            //     let n = prev;
            //     if (!n.includes(ques.word)) {
            //         n.push(ques.word);
            //     }
            //     return n;
            // });
          }
        }
        setFormattedmessage(formatted_msg);
        //   setMessages((prev) => {
        //     return [...prev, formatted_msg];
        //   });
      }
    } catch (error) {}
  };

  const handleNext = () => {
    // if(selectedOption == "" || answer == null ){
    //     window.alert("Provide an answer for this word.")
    //     return
    // }
    setSelectedOption("");
    handleStartQuiz();
  };

  useEffect(() => {
    // getWords();
  }, []);

  const handleStartQuiz = async () => {
    try {
        seterror(false)
      setAnswer(null);
      setLoading(true);

      let msgs = messages;

      msgs = [
        ...msgs,
        {
          role: "user",
          content: `Next word?`,
          type: "message",
        },
      ];

      setMessages(msgs);

      let nf = functions;
      // nf[0].description = nf[0].description+`, do not use word from this list -> [${words.join(", ")}]`

      const body = {
        frequency_penalty: 0,
        max_tokens: 1024,
        model: "gpt-4",
        // model: "gpt-3.5-turbo-16k",
        // model: "gpt-3.5-turbo-0613",
        temperature: 1,
        top_p: 1,
        presence_penalty: 0,
        // stream: true,
        // messages: initial_messages,
        messages: msgs
          .filter((message) => message.type === "message" || message.type === "internal")
          .map((message) => {
            if (message.role == "function") {
              return {
                role: message.role,
                content: message.content,
                name: message.name,
              };
            }
            return {
              role: message.role,
              content: message.content,
            };
          }),
        functions: nf,
        function_call: { name: "get-question" },
      };

      let resp = await axios.post("https://api.openai.com/v1/chat/completions", body, {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });
      if(resp?.data?.error){
        seterror(true)
      }
      if (resp?.data?.choices && resp.data.choices.length > 0) {
        let msg = resp.data.choices[0].message;
        let formatted_msg = { type: "message" };
        if (msg.hasOwnProperty("function_call")) {
          if (msg.function_call.name == "get-question") {
            let ques = JSON.parse(msg.function_call.arguments);
            formatted_msg.content = msg.function_call.arguments;
            formatted_msg.name = "get-question";
            formatted_msg.role = "function";
            setQuestion({
              word: ques.word,
              options: [...ques.options],
            });
            setWords((prev) => {
              let n = prev;
              if (!n.includes(ques.word)) {
                n.push(ques.word);
              }
              return n;
            });
          }
          if (msg.function_call.name == "getQuestion") {
            let ques = JSON.parse(msg.function_call.arguments);
            formatted_msg.content = ques.question;
            // formatted_msg.name = "get-question";
            formatted_msg.role = "assistant";
            setQuestion({
              word: ques.question,
              options: ["a", "b", "c", "d"],
            });
            setWords((prev) => {
              let n = prev;
              if (!n.includes(ques.question)) {
                n.push(ques.question);
              }
              return n;
            });
          }
        }
        setFormattedmessage(formatted_msg);
        setCounter((prev) => +prev + 1);
        setMessages((prev) => {
          return [...prev, formatted_msg];
        });
      }
      setLoading(false);
    } catch (error) {
        seterror(true)
      setCounter((prev) => +prev + 1);
      setLoading(false);
    }
  };

  const handleOptionSelect = (index) => {
    if(answer != null) return
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    seterror(false)
    if (![0, 1, 2, 3].includes(selectedOption)) {
      window.alert("Select an option first");
      return;
    }

    if (answer != null) {
      return;
    }
    setLoading(true);
    let msgs = messages;
    let msg = {
      content: `is option ${+selectedOption + 1} correct?`,
      role: "user",
      type: "message",
    };
    msgs = [
      ...msgs,
      //   formattedmessage,
      { content: `is option ${+selectedOption + 1} correct?`, role: "user", type: "message" },
    ];
    // setMessages((prev) => {
    //   return [...prev, msg];
    // });
    // console.log("first")
    const body = {
      frequency_penalty: 0,
      max_tokens: 1024,
      model: "gpt-4",
      //   model: "gpt-3.5-turbo-16k",
      // model: "gpt-3.5-turbo-0613",
      temperature: 0,
      top_p: 1,
      presence_penalty: 0,
      // stream: true,
      // messages: initial_messages,
      messages: msgs
        .filter((message) => message.type === "message" || message.type === "internal")
        .map((message) => {
          if (message.role == "function") {
            return {
              role: message.role,
              content: message.content,
              name: message.name,
            };
          }
          return {
            role: message.role,
            content: message.content,
          };
        }),
      functions: functions,
      function_call: { name: "get-answer" },
    };

    let resp = await axios.post("https://api.openai.com/v1/chat/completions", body, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    if(resp?.data?.error){
        seterror(true)
      }
    if (resp.data.choices && resp.data.choices.length > 0) {
      let msg = resp.data.choices[0].message;
      //   let n_msg = { role: "assistant", content: msg.function_call.arguments, type: "message" };
      let ans = JSON.parse(msg.function_call.arguments);
      setAnswer(ans.answer);
      //   setMessages((prev) => {
      //     return [...prev, n_msg];
      //   });
    }
    setLoading(false);
  };

  if (keyAdded == false) {
    return (
      <div className="key_wrapper">
        <input
          style={{ padding: "5px" }}
          type="text"
          placeholder="Add key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button style={{ marginLeft: "10px" }} onClick={() => setKeyAdded(true)}>
          Add key
        </button>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="quiz_wrapper">
        <h1 className="header">QUIZ APP</h1>
        {question && (
          <div className="question_answer">
            <div className="question">Q .{words.length} -- {question.word} ?</div>
            <div className="answers">
              {question.options.map((option, index) => (
                <div
                  className="answer"
                  key={index}
                  style={{
                    border:
                      answer != null
                        ? option == answer
                          ? "3px solid green"
                          : selectedOption == index && answer != option && answer != null
                          ? "3px solid red"
                          : ""
                        : "",
                  }}
                >
                  <label>
                    <input
                      type="radio"
                      name="option"
                      value={index}
                      checked={index === selectedOption}
                      onChange={() => handleOptionSelect(index)}
                    />
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {loading ? (
              <div className="loading">Loading ...</div>
            ) : (
              <div className="buttons">
                <button onClick={handleSubmit}>Submit</button>
                <button onClick={handleNext}>Next question</button>
              </div>
            )}
            { error && <div className="error" >Please try again after 5 to 6 seconds</div> }
          </div>
        )}
        {question == null ? (
          loading ? (
            <div>Loading...</div>
          ) : (
            <button className="start_button" onClick={handleStartQuiz}>
              Start Quiz
            </button>
          )
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default QuizApp;
