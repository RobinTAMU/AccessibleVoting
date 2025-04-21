
function speak(text, callback) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.5;
    utter.onend = () => callback?.();
    synth.speak(utter);
  }
  
  function listen(validCommands, callback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported.");
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    recognition.onresult = (event) => {
      let spoken = event.results[0][0].transcript.toLowerCase().trim();
      spoken = spoken.replace(/[^\w\s]/gi, ''); // remove punctuation
  
      console.log(`[VoiceAssist] You said: "${spoken}"`);
      callback(spoken);
    };
  
    recognition.onerror = (e) => {
      console.error("[VoiceAssist] Speech recognition error:", e);
      speak("An error occurred. Please try again.");
    };
  
    recognition.start();
  }
  
  
  // Part 1: Introduction
  
  const introScript = `Welcome to the Accessible Digital Voting Application System.
  You are voting in the 2024 Presidential Election for the United States of America.
  This application will guide you through a three-part process to cast your vote.
  Part one introduces the names of the candidates and their running mates.
  Part two allows you to select your preferred candidate by stating two unique numbers out-loud, which will be clearly presented to you.
  Step three will give you the opportunity to review and confirm your selection, then cast your vote.
  Before we begin, please confirm that you are interested in voting in this election and that you understand and agree to the voting rules and procedures.
  If you are ready to proceed, say ‘Yes.’ If you would like to hear the instructions again, say ‘Repeat.’`;
  
  function runIntroInteraction(onConfirm) {
    function handleResponse(response) {
      if (response === 'yes') {
        onConfirm();
      } else if (response === 'repeat') {
        speak(introScript, () => listen(['yes', 'repeat'], handleResponse));
      } else {
        speak("Please say Yes or Repeat.", () => listen(['yes', 'repeat'], handleResponse));
      }
    }
  
    speak(introScript, () => listen(['yes', 'repeat'], handleResponse));
  }
  
  // Part 2: Candidate Selection
  
  const candidateInstructions = `We will now begin Part 1 of the voting process. 
  The candidates in this election are:
  For the Republican party: Donald J. Trump for president and J.D. Vance for vice president. 
  For the Democrat party: Kamala D. Harris for president and Tim Walz for vice president. 
  For the Libertarian party: Chase Oliver for president and Mike ter Maat for vice president.
  If you are ready to proceed, say ‘Yes.’ If you would like to hear Part 1’s instructions again, say ‘Repeat.’`;
  
  const numberInstructions = `We will now begin Part 2 of the voting process. You will be asked to say two numbers.
  Please ensure you include the word, and, between the two numbers. 
  To cast your vote for the Republican party candidates, say the numbers “Eight” and “Two.”
  For the Democrat party, say “Four” and “Seven.”
  For the Libertarian party, say “Nine” and “One.”`;
  
  const numberCombos = [
    {
      keywords: ['8', 'two', 'eight', '2', '800', '200'],
      party: "REPUBLICAN",
      president: "Donald J. Trump",
      vice: "J.D. Vance"
    },
    {
      keywords: ['4', 'seven', 'four', '7', '400', '700'],
      party: "DEMOCRAT",
      president: "Kamala D. Harris",
      vice: "Tim Walz"
    },
    {
      keywords: ['9', 'one', 'nine', '1', '900', '100'],
      party: "LIBERTARIAN",
      president: "Chase Oliver",
      vice: "Mike ter Maat"
    }
  ];
  
  
  function runCandidateSelection(onConfirm, fromCancel = false) {
    if (fromCancel) {
      step2(); // Skip the long list of candidate bios
      return;
    }
  
    step1();
  
    function step1() {
      speak(candidateInstructions, () => {
        listen(['yes', 'repeat'], (res) => {
          if (res === 'yes') step2();
          else step1();
        });
      });
    }
  
    function step2() {
      speak(numberInstructions, () => {
        listen([], (res) => {
          const cleaned = res
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\bto\b/g, 'two')
            .split(/\s+/)
            .filter(word => !['and'].includes(word));
  
          const matchedCombo = numberCombos.find(combo => {
            const matched = combo.keywords.filter(k => cleaned.includes(k));
            return matched.length == 2;
          });
  
          if (res.includes('repeat')) {
            step2();
          } else if (matchedCombo) {
            localStorage.setItem('vote_party', matchedCombo.party);
            localStorage.setItem('vote_president', matchedCombo.president);
            localStorage.setItem('vote_vice', matchedCombo.vice);

            // Select the actual radio input for visual feedback
            const radios = document.querySelectorAll("input[type='radio']");
            radios.forEach(radio => {
              const label = radio.closest("label");
              if (label && label.innerText.toLowerCase().includes(matchedCombo.president.toLowerCase())) {
                radio.checked = true;
                // Optionally dispatch a change event if needed
                radio.dispatchEvent(new Event("change"));
              }
            });
  
            const confirmScript = `You have selected the ${matchedCombo.party} party. ${matchedCombo.president} for president and ${matchedCombo.vice} for vice president. 
  If you are ready to proceed, say Yes. If you would like to hear Part 2's instructions again, say Repeat.`;
  
            speak(confirmScript, () => {
              listen(['yes', 'repeat'], (res2) => {
                if (res2 === 'yes') {
                  onConfirm();
                } else {
                  step2();
                }
              });
            });
          } else {
            speak("Sorry, I didn't understand. Please say a valid number pair or say Repeat.", () => step2());
          }
        });
      });
    }
  }
  
  
  // Part 3: Confirmation
  
  function runConfirmationInteraction(onConfirm, onCancel) {
    const president = localStorage.getItem('vote_president');
    const vice = localStorage.getItem('vote_vice');
    const party = localStorage.getItem('vote_party');
  
    const message = `In Part 2 of the voting process, you selected the ${party} party. ${president} for president and ${vice} for vice president. 
  If you would like to confirm your selection and cast your vote, say ‘Confirm.’
  If you would like to change your selection and return to Part 2, say ‘Cancel.’
  If you would like to hear Part 3’s instructions again, say ‘Repeat.’`;
  
    function repeat() {
      speak(message, () => {
        listen(['confirm', 'cancel', 'repeat'], handleResponse);
      });
    }
  
    function handleResponse(res) {
      if (res === 'confirm') {
        speak("Congratulations, you have completed the voting process. You may now exit the poll station. Thank you for your participation.", onConfirm);
      } else if (res === 'cancel') {
        speak("Returning to Part 2.", onCancel);
      } else {
        repeat(); // repeat Part 3
      }
    }
  
    repeat();
  }
  