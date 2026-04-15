import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useVoiceAPI } from "../hooks/useVoiceAPI";
import { getDashboardStats, getSessionHistory, getChildProgress } from "../api/games";
import { listChildren } from "../api/patients";
import { SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import UiIcon from "../components/ui/UiIcon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as RechartsContainer, AreaChart, Area } from "recharts";
import ProgressRing from "../components/ProgressRing";
import { AnimalStickers, FruitStickers, ShapeStickers, VehicleStickers, ObjectStickers, NumberStickers, PatternStickers } from "../components/Stickers";
import {
  AmbientParticles,
  ConfettiExplosion,
  SmoothButton,
  Sticker3D,
  SpringContainer,
  FloatingEmoji,
  MagicalSparkles,
  SuccessBurst,
  FloatingOrbs,
  BouncingStars,
  PulsingHeart
} from "../components/AmbientEffects";
import { MusicPlayer, MusicPlayerButton } from "../components/MusicPlayer";
import AIAgentPanel, { AIAgentButton } from "../components/AIAgentPanel";
import "../styles/professional.css";
import "../styles/ai-agents.css";
import "../styles/game-enhancements.css";
import "./Dashboard.css";

// Library of Content - MASSIVELY EXPANDED
const CONTENT_LIBRARY = {
  songs: [
    { title: "Twinkle Twinkle Little Star", lyrics: "Twinkle, twinkle, little star, how I wonder what you are! Up above the world so high, like a diamond in the sky. Twinkle, twinkle, little star, how I wonder what you are!" },
    { title: "The ABC Song", lyrics: "A B C D E F G, H I J K L M N O P, Q R S, T U V, W X, Y and Z. Now I know my ABCs, next time won't you sing with me?" },
    { title: "Happy Birthday", lyrics: "Happy birthday to you, happy birthday to you, happy birthday dear friend, happy birthday to you!" },
    { title: "If You're Happy and You Know It", lyrics: "If you're happy and you know it, clap your hands! If you're happy and you know it, clap your hands! If you're happy and you know it, and you really want to show it, if you're happy and you know it, clap your hands!" },
    { title: "The Wheels on the Bus", lyrics: "The wheels on the bus go round and round, round and round, round and round. The wheels on the bus go round and round, all through the town!" },
    { title: "Old MacDonald", lyrics: "Old MacDonald had a farm, E I E I O! And on that farm he had a cow, E I E I O! With a moo moo here and a moo moo there, here a moo, there a moo, everywhere a moo moo!" },
    { title: "Row Row Row Your Boat", lyrics: "Row, row, row your boat, gently down the stream. Merrily, merrily, merrily, merrily, life is but a dream!" },
    { title: "Itsy Bitsy Spider", lyrics: "The itsy bitsy spider went up the water spout. Down came the rain and washed the spider out. Out came the sun and dried up all the rain. Then the itsy bitsy spider went up the spout again!" },
    { title: "Mary Had a Little Lamb", lyrics: "Mary had a little lamb, little lamb, little lamb. Mary had a little lamb, its fleece was white as snow. And everywhere that Mary went, Mary went, Mary went. Everywhere that Mary went, the lamb was sure to go!" },
    { title: "Five Little Ducks", lyrics: "Five little ducks went out one day, over the hills and far away. Mother duck said quack quack quack quack, but only four little ducks came back. Four little ducks went out one day... but only three little ducks came back!" },
    { title: "The Hokey Pokey", lyrics: "You put your right hand in, you put your right hand out. You put your right hand in, and you shake it all about. You do the hokey pokey and you turn yourself around. That's what it's all about!" },
    { title: "Head Shoulders Knees and Toes", lyrics: "Head, shoulders, knees and toes, knees and toes. Head, shoulders, knees and toes, knees and toes. And eyes and ears and mouth and nose. Head, shoulders, knees and toes, knees and toes!" },
    { title: "Baa Baa Black Sheep", lyrics: "Baa baa black sheep, have you any wool? Yes sir, yes sir, three bags full. One for the master, one for the dame, and one for the little boy who lives down the lane." },
    { title: "Hickory Dickory Dock", lyrics: "Hickory dickory dock, the mouse ran up the clock. The clock struck one, the mouse ran down. Hickory dickory dock!" },
    { title: "London Bridge is Falling Down", lyrics: "London Bridge is falling down, falling down, falling down. London Bridge is falling down, my fair lady. Build it up with iron and steel, iron and steel, iron and steel..." }
  ],
  poems: [
    { title: "The Little Turtle", author: "Vachel Lindsay", text: "There was a little turtle. He lived in a box. He swam in a puddle. He climbed on the rocks. He snapped at a mosquito. He snapped at a flea. He snapped at a minnow. And he snapped at me. He caught the mosquito. He caught the flea. He caught the minnow. But he didn't catch me!" },
    { title: "The Rainbow", author: "Christina Rossetti", text: "Boats sail on the rivers, and ships sail on the seas. But clouds that sail across the sky are prettier than these. There are bridges on the rivers, as pretty as you please. But the bow that bridges heaven, and overtops the trees, and builds a road from earth to sky, is prettier far than these." },
    { title: "The Sunshine", author: "Anonymous", text: "The sun is shining brightly, up in the sky so blue. It wakes the flowers and trees, and all the children too. The birds begin to sing their songs, the bees begin to buzz. Oh what a happy morning, for all of us it was!" },
    { title: "Kindness", author: "Anonymous", text: "Kindness is like a warm sunshine, that makes the whole world bright. A smile can light up someone's day, and make their burdens light. So spread your kindness everywhere, like seeds upon the ground. And watch the world become more beautiful, with kindness all around." },
    { title: "Dreams", author: "Langston Hughes", text: "Hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly. Hold fast to dreams, for when dreams go, life is a barren field frozen with snow." },
    { title: "Trees", author: "Joyce Kilmer", text: "I think that I shall never see a poem lovely as a tree. A tree whose hungry mouth is pressed against the earth's sweet flowing breast. A tree that looks at God all day, and lifts her leafy arms to pray." },
    { title: "The Star", author: "Jane Taylor", text: "Twinkle, twinkle, little star, how I wonder what you are! Up above the world so high, like a diamond in the sky. When the blazing sun is gone, when he nothing shines upon, then you show your little light, twinkle, twinkle, all the night." },
    { title: "My Shadow", author: "Robert Louis Stevenson", text: "I have a little shadow that goes in and out with me, and what can be the use of him is more than I can see. He is very, very like me from the heels up to the head, and I see him jump before me, when I jump into my bed." },
    { title: "The Swing", author: "Robert Louis Stevenson", text: "How do you like to go up in a swing, up in the air so blue? Oh, I do think it the pleasantest thing ever a child can do! Up in the air and over the wall, till I can see so wide. Rivers and trees and cattle and all over the countryside." },
    { title: "Fog", author: "Carl Sandburg", text: "The fog comes on little cat feet. It sits looking over harbor and city on silent haunches and then moves on." },
    { title: "Snowball", author: "Shel Silverstein", text: "I made myself a snowball as perfect as could be. I thought I'd keep it as a pet and let it sleep with me. I made it some pajamas and a pillow for its head. Then last night it ran away, but first it wet the bed." },
    { title: "Caterpillar", author: "Christina Rossetti", text: "Brown and furry caterpillar in a hurry, take your walk to the shady leaf, or stalk, or whatnot, which may be the chosen spot. No toad spy you, hovering bird of prey pass by you; spin and die, to live again a butterfly." }
  ],
  stories: [
    { title: "The Little Star", content: "Once upon a time, there was a tiny little star who lived high up in the night sky. While all the other stars were big and bright, this little star felt small and dim. One night, a little girl looked up and said, 'Mommy, look at that tiny star! It's my favorite because it's special and unique, just like me!' The little star glowed with happiness, realizing that being different made him special. From that day on, he shone with confidence, knowing that someone loved him just the way he was." },
    { title: "The Brave Little Ant", content: "In a tiny ant colony, there lived a small ant named Andy. While other ants were afraid to cross the big puddle after rain, Andy was brave. One day, the queen ant's crown fell into the puddle! All the big ants were scared of the water. But brave little Andy built a bridge with leaves and sticks, crossed the puddle, and rescued the crown. The queen made Andy the Royal Knight, and all the ants learned that courage comes in all sizes!" },
    { title: "The Magic Seed", content: "Emma found a strange seed in her garden. She planted it with love, watered it every day, and sang to it. Days passed, then weeks. Emma almost gave up. But one morning, a magnificent rainbow-colored flower bloomed! A tiny fairy emerged and said, 'Your patience and love created magic. Never give up on your dreams!' Emma learned that good things take time and love makes everything grow." },
    { title: "The Friendly Dolphin", content: "Daisy was a dolphin who loved to help others. One day, she saw a little fish trapped in a net. She called her friends, and together they pushed the net until the fish was free. The little fish thanked Daisy and promised to help someone else. Kindness spreads like ripples in the ocean!" },
    { title: "The Lost Kitten", content: "Lily found a tiny kitten hiding under her porch. It was cold and scared. She brought it warm milk and a soft blanket. The kitten purred and snuggled close. Lily's parents said they could keep it. She named it Lucky because they were lucky to find each other. Lily learned that helping someone in need brings the best kind of friendship." },
    { title: "The Rainbow Bird", content: "There once was a plain gray bird who wished for colorful feathers. One day, the bird helped a butterfly escape from a spider web. The fairy queen appeared and said, 'For your kindness, I grant you rainbow colors!' The bird became the most beautiful creature in the forest. But what made it truly special was that it still helped every creature it met. True beauty comes from being kind." },
    { title: "The Sharing Bear", content: "Benny the bear had a huge jar of honey. He loved eating it all by himself. But when winter came, his friends were hungry. Benny shared his honey, and everyone had enough. The next spring, his friends brought him berries, nuts, and fish. Benny learned that sharing makes happiness grow bigger, just like magic!" },
    { title: "The Quiet Bunny", content: "Bonnie was a shy bunny who never spoke in class. One day, a new student, a tiny mouse, sat alone at lunch. Bonnie bravely walked over and said, 'Want to share my carrot?' They became best friends. Bonnie learned that one small brave moment can change everything. Now she helps other shy bunnies find their voice too!" },
    { title: "The Grateful Pumpkin", content: "Percy was a small pumpkin who wished he was bigger. Then a hungry bird family needed food. Percy was just the right size for them to share. 'Thank you for being exactly as you are!' they chirped. Percy learned that being just right is better than being big. He was grateful for his perfect size." },
    { title: "The Helpful Wind", content: "Wendy the wind saw a little seed stuck in a crack. She gently blew and blew until the seed landed in soft soil. Days later, a beautiful flower grew! Wendy visits it every day, making it dance. Sometimes the smallest help can make the biggest difference." }
  ],
  books: [
    { title: "Alice in Wonderland - Chapter 1 Excerpt", author: "Lewis Carroll", excerpt: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice, 'without pictures or conversations?' So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her." },
    { title: "The Little Prince - Chapter 1", author: "Antoine de Saint-Exupéry", excerpt: "Once when I was six years old I saw a magnificent picture in a book, called True Stories from Nature, about the primeval forest. It was a picture of a boa constrictor in the act of swallowing an animal. In the book it said: 'Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion.' I pondered deeply, then, over the adventures of the jungle." },
    { title: "Peter Pan - Chapter 1", author: "J.M. Barrie", excerpt: "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden, and she plucked another flower and ran with it to her mother. I suppose she must have looked rather delightful, for Mrs. Darling put her hand to her heart and cried, 'Oh, why can't you remain like this forever!' This was all that passed between them on the subject, but henceforth Wendy knew that she must grow up." },
    { title: "Charlotte's Web - Excerpt", author: "E.B. White", excerpt: "'Where's Papa going with that ax?' said Fern to her mother as they were setting the table for breakfast. 'Out to the hoghouse,' replied Mrs. Arable. 'Some pigs were born last night.' 'I don't see why he needs an ax,' continued Fern, who was only eight. 'Well,' said her mother, 'one of the pigs is a runt. It's very small and weak, and it will never amount to anything. So your father has decided to do away with it.'" },
    { title: "The Secret Garden - Chapter 1", author: "Frances Hodgson Burnett", excerpt: "When Mary Lennox was sent to Misselthwaite Manor to live with her uncle, everybody said she was the most disagreeable-looking child ever seen. It was true, too. She had a little thin face and a little thin body, thin light hair and a sour expression. Her hair was yellow, and her face was yellow because she had been born in India and had always been ill in one way or another." },
    { title: "Anne of Green Gables - Chapter 1", author: "L.M. Montgomery", excerpt: "Mrs. Rachel Lynde lived just where the Avonlea main road dipped down into a little hollow, fringed with alders and ladies' eardrops and traversed by a brook that had its source away back in the woods of the old Cuthbert place. It was bounded on one side by the road, on the other by a hedge of gigantic spruce. Mrs. Rachel was sitting at her window, knitting, when she saw something that made her drop her knitting and stare in amazement." },
    { title: "The Wizard of Oz - Chapter 1", author: "L. Frank Baum", excerpt: "Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer's wife. Their house was small, for the lumber to build it had to be carried by wagon many miles. There were four walls, a floor and a roof, which made one room; and this room contained a rusty looking cookstove, a cupboard for dishes, a table, three or four chairs, and the beds." },
    { title: "Winnie the Pooh - Chapter 1", author: "A.A. Milne", excerpt: "Here is Edward Bear, coming downstairs now, bump, bump, bump, on the back of his head, behind Christopher Robin. It is, as far as he knows, the only way of coming downstairs, but sometimes he feels that there really is another way, if only he could stop bumping for a moment and think of it. And then he feels that perhaps there isn't." }
  ],
  // EXPANDED: Interactive Mini Games - 3X More Content
  games: {
    riddles: [
      { question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", answer: "a map", hint: "You use me to find your way!" },
      { question: "What has keys but no locks, space but no room, and you can enter but not go in?", answer: "a keyboard", hint: "You use me to type!" },
      { question: "I am tall when I'm young, and short when I'm old. What am I?", answer: "a candle", hint: "I give light!" },
      { question: "What has hands but cannot clap?", answer: "a clock", hint: "I tell time!" },
      { question: "What has a head and a tail but no body?", answer: "a coin", hint: "You can flip me!" },
      { question: "What gets wetter the more it dries?", answer: "a towel", hint: "You use me after a bath!" },
      { question: "What has to be broken before you can use it?", answer: "an egg", hint: "You eat me for breakfast!" },
      { question: "I have branches, but no fruit, trunk, or leaves. What am I?", answer: "a bank", hint: "You keep money in me!" },
      { question: "What can travel around the world while staying in a corner?", answer: "a stamp", hint: "You put me on letters!" },
      { question: "What has an eye but cannot see?", answer: "a needle", hint: "You use me for sewing!" },
      { question: "What can you catch but not throw?", answer: "a cold", hint: "You get sick with me!" },
      { question: "What belongs to you but other people use it more than you?", answer: "your name", hint: "Everyone calls you by it!" },
      { question: "What has a neck but no head?", answer: "a bottle", hint: "You drink from me!" },
      { question: "What has one eye but can't see?", answer: "a potato", hint: "I'm a vegetable!" },
      { question: "What goes up but never comes down?", answer: "your age", hint: "It grows every birthday!" }
    ],
    trivia: [
      { question: "What is the largest planet in our solar system?", answer: "jupiter", options: ["Earth", "Mars", "Jupiter", "Saturn"] },
      { question: "How many continents are there on Earth?", answer: "seven", options: ["Five", "Six", "Seven", "Eight"] },
      { question: "What is the fastest land animal?", answer: "cheetah", options: ["Lion", "Cheetah", "Leopard", "Tiger"] },
      { question: "How many days are in a year?", answer: "365", options: ["360", "365", "366", "370"] },
      { question: "What is the tallest animal in the world?", answer: "giraffe", options: ["Elephant", "Giraffe", "Whale", "Ostrich"] },
      { question: "What color do you get when you mix red and blue?", answer: "purple", options: ["Green", "Orange", "Purple", "Brown"] },
      { question: "How many legs does a spider have?", answer: "eight", options: ["Six", "Eight", "Ten", "Twelve"] },
      { question: "What is the smallest prime number?", answer: "two", options: ["Zero", "One", "Two", "Three"] },
      { question: "Which planet is closest to the Sun?", answer: "mercury", options: ["Venus", "Earth", "Mars", "Mercury"] },
      { question: "How many colors are in a rainbow?", answer: "seven", options: ["Five", "Six", "Seven", "Eight"] },
      { question: "What is the largest ocean on Earth?", answer: "pacific", options: ["Atlantic", "Indian", "Arctic", "Pacific"] },
      { question: "How many sides does a triangle have?", answer: "three", options: ["Two", "Three", "Four", "Five"] },
      { question: "What is the capital of France?", answer: "paris", options: ["London", "Berlin", "Madrid", "Paris"] },
      { question: "Which animal is known as the 'King of the Jungle'?", answer: "lion", options: ["Tiger", "Elephant", "Lion", "Gorilla"] },
      { question: "What do bees make?", answer: "honey", options: ["Wax", "Honey", "Silk", "Milk"] }
    ],
    math: {
      easy: [
        { question: "What is 5 plus 3?", answer: "8" },
        { question: "What is 10 minus 4?", answer: "6" },
        { question: "What is 2 times 3?", answer: "6" },
        { question: "What is 8 divided by 2?", answer: "4" },
        { question: "What is 7 plus 2?", answer: "9" },
        { question: "What is 15 minus 5?", answer: "10" },
        { question: "What is 3 times 4?", answer: "12" },
        { question: "What is 9 divided by 3?", answer: "3" },
        { question: "What is 4 plus 4?", answer: "8" },
        { question: "What is 12 minus 3?", answer: "9" }
      ],
      medium: [
        { question: "What is 12 plus 15?", answer: "27" },
        { question: "What is 25 minus 13?", answer: "12" },
        { question: "What is 4 times 6?", answer: "24" },
        { question: "What is 18 divided by 3?", answer: "6" },
        { question: "What is 9 plus 8?", answer: "17" },
        { question: "What is 30 minus 12?", answer: "18" },
        { question: "What is 5 times 5?", answer: "25" },
        { question: "What is 21 divided by 7?", answer: "3" },
        { question: "What is 16 plus 14?", answer: "30" },
        { question: "What is 40 minus 15?", answer: "25" }
      ],
      hard: [
        { question: "What is 15 times 4?", answer: "60" },
        { question: "What is 100 divided by 5?", answer: "20" },
        { question: "What is 23 plus 19?", answer: "42" },
        { question: "What is 50 minus 27?", answer: "23" },
        { question: "What is 7 times 8?", answer: "56" },
        { question: "What is 13 times 6?", answer: "78" },
        { question: "What is 144 divided by 12?", answer: "12" },
        { question: "What is 67 plus 28?", answer: "95" },
        { question: "What is 83 minus 45?", answer: "38" },
        { question: "What is 9 times 9?", answer: "81" }
      ]
    },
    spelling: [
      { word: "rainbow", hint: "Colors in the sky after rain", sticker: ShapeStickers.star },
      { word: "butterfly", hint: "A colorful flying insect" },
      { word: "adventure", hint: "An exciting journey" },
      { word: "beautiful", hint: "Very pretty" },
      { word: "elephant", hint: "A big animal with a trunk", sticker: AnimalStickers.elephant },
      { word: "friendship", hint: "Being friends" },
      { word: "happiness", hint: "Feeling joyful" },
      { word: "knowledge", hint: "What you learn", sticker: ObjectStickers.book },
      { word: "mountain", hint: "A tall hill", sticker: ShapeStickers.triangle },
      { word: "sunshine", hint: "Light from the sun", sticker: ObjectStickers.sun },
      { word: "wonderful", hint: "Amazing and great" },
      { word: "butterfly", hint: "It starts as a caterpillar" },
      { word: "chocolate", hint: "Sweet brown treat" },
      { word: "dinosaur", hint: "Ancient giant reptile", sticker: AnimalStickers.lion },
      { word: "fantastic", hint: "Really great and amazing", sticker: ObjectStickers.star }
    ],
    wordScramble: [
      { scrambled: "E P L A P", answer: "apple", hint: "A red or green fruit", sticker: FruitStickers.apple },
      { scrambled: "Y R A R I N B O W", answer: "rainbow", hint: "Colors in the sky", sticker: ShapeStickers.star },
      { scrambled: "E L P H A N T", answer: "elephant", hint: "Big animal with trunk", sticker: AnimalStickers.elephant },
      { scrambled: "S U N", answer: "sun", hint: "It shines in the sky", sticker: ObjectStickers.sun },
      { scrambled: "O O D G", answer: "good", hint: "Opposite of bad", sticker: ShapeStickers.heart },
      { scrambled: "T A E R W", answer: "water", hint: "You drink this" },
      { scrambled: "R I B D", answer: "bird", hint: "Animal that flies", sticker: AnimalStickers.bird },
      { scrambled: "S O U H E", answer: "house", hint: "Where you live", sticker: ObjectStickers.house },
      { scrambled: "A T C", answer: "cat", hint: "Says meow", sticker: AnimalStickers.cat },
      { scrambled: "T R E E", answer: "tree", hint: "Has leaves", sticker: ObjectStickers.flower }
    ],
    animalSounds: [
      { animal: "dog", sound: "woof woof", sticker: AnimalStickers.dog },
      { animal: "cat", sound: "meow", sticker: AnimalStickers.cat },
      { animal: "cow", sound: "moo", sticker: AnimalStickers.cow },
      { animal: "pig", sound: "oink oink", sticker: AnimalStickers.pig },
      { animal: "duck", sound: "quack quack", sticker: AnimalStickers.duck },
      { animal: "sheep", sound: "baa", sticker: AnimalStickers.sheep },
      { animal: "horse", sound: "neigh", sticker: AnimalStickers.horse },
      { animal: "chicken", sound: "cluck cluck", sticker: AnimalStickers.chicken },
      { animal: "frog", sound: "ribbit", sticker: AnimalStickers.frog },
      { animal: "bird", sound: "tweet tweet", sticker: AnimalStickers.bird },
      { animal: "lion", sound: "roar", sticker: AnimalStickers.lion },
      { animal: "monkey", sound: "ooh ooh aah aah", sticker: AnimalStickers.monkey },
      { animal: "elephant", sound: "trumpet", sticker: AnimalStickers.elephant },
      { animal: "snake", sound: "hiss", sticker: AnimalStickers.snake },
      { animal: "bee", sound: "buzz", sticker: AnimalStickers.bee }
    ],
    // NEW: Color Guessing Game
    colors: [
      { name: "red", hex: "#FF6B6B", hint: "The color of apples and strawberries" },
      { name: "blue", hex: "#4ECDC4", hint: "The color of the sky and ocean" },
      { name: "green", hex: "#95E1D3", hint: "The color of grass and leaves" },
      { name: "yellow", hex: "#FFD93D", hint: "The color of the sun and bananas" },
      { name: "purple", hex: "#C7CEEA", hint: "The color of grapes and violets" },
      { name: "orange", hex: "#FFA07A", hint: "The color of oranges and carrots" },
      { name: "pink", hex: "#FFB6C1", hint: "The color of roses and flamingos" },
      { name: "brown", hex: "#D4A373", hint: "The color of chocolate and bears" },
      { name: "black", hex: "#2D3436", hint: "The color of night and crows" },
      { name: "white", hex: "#F8F9FA", hint: "The color of snow and clouds" }
    ],
    // NEW: Shape Recognition Game with Stickers
    shapes: [
      { name: "circle", sides: 0, hint: "Round like a ball or the sun", sticker: ShapeStickers.circle },
      { name: "square", sides: 4, hint: "Four equal sides like a box", sticker: ShapeStickers.square },
      { name: "triangle", sides: 3, hint: "Three sides like a mountain", sticker: ShapeStickers.triangle },
      { name: "rectangle", sides: 4, hint: "Like a door or book", sticker: ShapeStickers.rectangle },
      { name: "star", sides: 10, hint: "Twinkles in the night sky", sticker: ShapeStickers.star },
      { name: "heart", sides: 0, hint: "Symbol of love", sticker: ShapeStickers.heart },
      { name: "diamond", sides: 4, hint: "Sparkly like a jewel", sticker: ShapeStickers.diamond },
      { name: "oval", sides: 0, hint: "Like an egg or a mirror", sticker: ShapeStickers.oval }
    ],
    // NEW: Pattern Completion Game with Stickers
    patterns: [
      { sequence: ["circleRed", "circleBlue", "circleRed", "circleBlue", "circleRed"], next: "circleBlue", options: ["circleRed", "circleBlue", "circleGreen"], type: "pattern" },
      { sequence: ["1", "2", "1", "2", "1"], next: "2", options: ["1", "2", "3"], type: "number" },
      { sequence: ["cat", "dog", "cat", "dog", "cat"], next: "dog", options: ["cat", "dog", "rabbit"], type: "animal" },
      { sequence: ["starYellow", "heartPink", "starYellow", "heartPink", "starYellow"], next: "heartPink", options: ["starYellow", "heartPink", "squarePurple"], type: "pattern" },
      { sequence: ["A", "B", "C", "A", "B"], next: "C", options: ["A", "B", "C"], type: "letter" },
      { sequence: ["apple", "banana", "apple", "banana", "apple"], next: "banana", options: ["apple", "banana", "orange"], type: "fruit" }
    ],
    // NEW: Memory Game Items with Stickers - ENHANCED with educational metadata
    memory: [
      { item: "apple", sticker: FruitStickers.apple, category: "fruit", name: "Apple", fact: "Apples float in water because they are 25% air!", color: "#FF6B6B" },
      { item: "banana", sticker: FruitStickers.banana, category: "fruit", name: "Banana", fact: "Bananas are berries, but strawberries aren't!", color: "#FFD93D" },
      { item: "orange", sticker: FruitStickers.orange, category: "fruit", name: "Orange", fact: "Oranges have more fiber than most fruits!", color: "#FFA500" },
      { item: "grapes", sticker: FruitStickers.grapes, category: "fruit", name: "Grapes", fact: "Grapes are 80% water!", color: "#9B59B6" },
      { item: "cat", sticker: AnimalStickers.cat, category: "animal", name: "Cat", fact: "Cats sleep for 70% of their lives!", sound: "meow", color: "#FFB6C1" },
      { item: "dog", sticker: AnimalStickers.dog, category: "animal", name: "Dog", fact: "Dogs have 18 muscles in each ear!", sound: "woof woof", color: "#D4A373" },
      { item: "rabbit", sticker: AnimalStickers.rabbit, category: "animal", name: "Rabbit", fact: "Rabbits can jump up to 3 feet high!", sound: "squeak", color: "#95E1D3" },
      { item: "bird", sticker: AnimalStickers.bird, category: "animal", name: "Bird", fact: "Some birds can talk like humans!", sound: "tweet tweet", color: "#87CEEB" },
      { item: "car", sticker: VehicleStickers.car, category: "vehicle", name: "Car", fact: "The first cars were called 'horseless carriages'!", color: "#FF6B6B" },
      { item: "bike", sticker: VehicleStickers.bike, category: "vehicle", name: "Bicycle", fact: "Bikes help keep your heart healthy!", color: "#4ECDC4" },
      { item: "airplane", sticker: VehicleStickers.airplane, category: "vehicle", name: "Airplane", fact: "Airplanes fly 35,000 feet in the sky!", color: "#87CEEB" },
      { item: "rocket", sticker: VehicleStickers.rocket, category: "vehicle", name: "Rocket", fact: "Rockets can go to the moon in 3 days!", color: "#FF69B4" },
      { item: "book", sticker: ObjectStickers.book, category: "object", name: "Book", fact: "Reading makes your brain stronger!", color: "#8B4513" },
      { item: "ball", sticker: ObjectStickers.ball, category: "object", name: "Ball", fact: "Playing ball helps you make friends!", color: "#FF6B6B" },
      { item: "sun", sticker: ObjectStickers.sun, category: "object", name: "Sun", fact: "The sun is a giant ball of fire!", color: "#FFD93D" },
      { item: "moon", sticker: ObjectStickers.moon, category: "object", name: "Moon", fact: "The moon controls the ocean waves!", color: "#C0C0C0" }
    ],
    // ENHANCED: Educational Game Metadata for Voice Agent
    gameMetadata: {
      riddles: {
        description: "Riddle games help children develop critical thinking and problem-solving skills by analyzing clues to find answers.",
        skills: ["Critical Thinking", "Problem Solving", "Language Comprehension"],
        praiseMessages: [
          "Amazing deduction skills! You solved that riddle like a detective!",
          "Your brain is working so fast! That was a tricky one!",
          "Brilliant thinking! You connected the clues perfectly!",
          "You're so clever! That riddle was challenging and you got it!",
          "Fantastic problem solving! Your mind is super sharp!"
        ]
      },
      trivia: {
        description: "Trivia builds general knowledge and memory recall about science, nature, geography and culture.",
        skills: ["General Knowledge", "Memory", "Science Awareness"],
        praiseMessages: [
          "Wow, you know so much about the world!",
          "You're like a walking encyclopedia! So smart!",
          "Amazing facts! You must love learning!",
          "Brilliant! You're becoming a knowledge master!",
          "Incredible memory! You remembered that perfectly!"
        ]
      },
      math: {
        description: "Math games build number sense, calculation skills, and logical reasoning through arithmetic challenges.",
        skills: ["Number Sense", "Calculation", "Logical Reasoning"],
        praiseMessages: [
          "Mathematical genius! Your calculations are perfect!",
          "You're a math wizard! Those numbers bow to you!",
          "Amazing arithmetic! Your math skills are growing so fast!",
          "Super star! You solved that faster than a calculator!",
          "Brilliant mathematician! Numbers are your friends!"
        ]
      },
      spelling: {
        description: "Spelling games enhance vocabulary, phonetic awareness, and written communication skills.",
        skills: ["Vocabulary", "Phonics", "Reading", "Writing"],
        praiseMessages: [
          "Spelling superstar! Every letter was perfect!",
          "You're a word wizard! That spelling was excellent!",
          "Fantastic! Your spelling skills are amazing!",
          "Letter perfect! You know your words so well!",
          "Brilliant speller! Keep building that vocabulary!"
        ]
      },
      wordScramble: {
        description: "Word scrambles develop pattern recognition, letter sequencing, and cognitive flexibility.",
        skills: ["Pattern Recognition", "Letter Recognition", "Problem Solving"],
        praiseMessages: [
          "Letter detective! You unscrambled that perfectly!",
          "Amazing word skills! Your brain sorted those letters fast!",
          "Puzzle master! You see patterns so clearly!",
          "Word wizard! Those scrambled letters didn't fool you!",
          "Brilliant unscrambling! Your mind is so sharp!"
        ]
      },
      animalSounds: {
        description: "Animal sound games build auditory discrimination and connect sounds to their animal sources.",
        skills: ["Auditory Recognition", "Animal Knowledge", "Sound Association"],
        praiseMessages: [
          "Animal expert! You know every creature's voice!",
          "Fantastic listening! You matched that sound perfectly!",
          "Nature lover! You know your animal friends so well!",
          "Sound detective! Your ears are super sharp!",
          "Amazing! You speak animal language fluently!"
        ]
      },
      colors: {
        description: "Color games develop visual discrimination, color naming, and artistic awareness.",
        skills: ["Visual Recognition", "Color Naming", "Art Appreciation"],
        praiseMessages: [
          "Color master! You know every shade perfectly!",
          "Artist eyes! You see colors so beautifully!",
          "Rainbow expert! Your color knowledge is amazing!",
          "Fantastic! You would make a great painter!",
          "Brilliant color recognition! You're so observant!"
        ]
      },
      shapes: {
        description: "Shape recognition develops spatial awareness, geometry basics, and visual analysis.",
        skills: ["Spatial Awareness", "Geometry", "Visual Analysis"],
        praiseMessages: [
          "Shape detective! You spotted that perfectly!",
          "Geometry genius! You know every shape's secret!",
          "Fantastic! Your eye for shapes is amazing!",
          "Shape master! You see the world in beautiful forms!",
          "Brilliant! You could be an architect someday!"
        ]
      },
      patterns: {
        description: "Pattern games develop sequence recognition, prediction skills, and logical thinking.",
        skills: ["Sequence Recognition", "Prediction", "Logical Thinking"],
        praiseMessages: [
          "Pattern master! You see the sequence perfectly!",
          "Logic champion! Your brain spotted the pattern!",
          "Amazing! You predict what comes next so well!",
          "Sequence expert! Patterns are easy for you!",
          "Brilliant! You think like a mathematician!"
        ]
      },
      memory: {
        description: "Memory games strengthen working memory, concentration, and visual recall abilities.",
        skills: ["Working Memory", "Concentration", "Visual Recall"],
        praiseMessages: [
          "Memory champion! Your brain is like a super computer!",
          "Amazing recall! You remembered everything perfectly!",
          "Concentration master! Your focus is incredible!",
          "Memory magician! You never forget a thing!",
          "Fantastic! Your memory muscles are super strong!"
        ]
      },
      // NEW: Speed Math - Timed challenges
      speedMath: {
        description: "Speed Math develops rapid calculation skills and mental math fluency under time pressure.",
        skills: ["Mental Math", "Quick Thinking", "Number Fluency"],
        praiseMessages: [
          "Lightning fast! Your brain works at super speed!",
          "Math speed demon! Faster than a calculator!",
          "Amazing reflexes! You calculate instantly!",
          "Speed champion! Time is on your side!",
          "Lightning brain! Zap! Math solved!"
        ]
      },
      // NEW: Picture Quiz - Visual recognition
      pictureQuiz: {
        description: "Picture Quiz builds visual recognition skills and connects images to their names and categories.",
        skills: ["Visual Recognition", "Categorization", "Vocabulary"],
        praiseMessages: [
          "Eagle eyes! You spotted that perfectly!",
          "Picture perfect! Your visual memory is amazing!",
          "Sharp eyes! Nothing escapes your notice!",
          "Visual genius! You see everything clearly!",
          "Fantastic! You know every picture by heart!"
        ]
      },
      // NEW: Word Chain - Word association
      wordChain: {
        description: "Word Chain develops vocabulary, quick thinking, and word association skills.",
        skills: ["Vocabulary", "Word Association", "Quick Thinking"],
        praiseMessages: [
          "Word wizard! Your vocabulary is endless!",
          "Chain master! You link words perfectly!",
          "Language genius! Words flow from you!",
          "Amazing connections! Your mind is so creative!",
          "Brilliant! You know so many words!"
        ]
      },
      // NEW: Counting Game - Number sequences
      countingGame: {
        description: "Counting games build number sense, sequence recognition, and quantity understanding.",
        skills: ["Number Sense", "Counting", "Sequences"],
        praiseMessages: [
          "Counting champion! Numbers are your friends!",
          "Sequence master! You know the order perfectly!",
          "Number ninja! You count like a pro!",
          "Quantity expert! You see numbers everywhere!",
          "Amazing counter! 1, 2, 3, you're the best!"
        ]
      },
      // NEW: Matching Game - Pair matching
      matchingGame: {
        description: "Matching games improve visual discrimination, memory, and pattern recognition.",
        skills: ["Visual Discrimination", "Pattern Matching", "Attention"],
        praiseMessages: [
          "Matching master! You find pairs instantly!",
          "Pattern genius! You see matches everywhere!",
          "Sharp eyes! Pairs can't hide from you!",
          "Memory matcher! You remember every card!",
          "Fantastic! You're the matching champion!"
        ]
      }
    },
    // NEW ENHANCED GAMES DATA
    speedMath: {
      easy: [
        { question: "5 + 3", answer: "8", timeLimit: 5 },
        { question: "10 - 4", answer: "6", timeLimit: 5 },
        { question: "2 × 3", answer: "6", timeLimit: 5 },
        { question: "7 + 2", answer: "9", timeLimit: 5 },
        { question: "8 - 3", answer: "5", timeLimit: 5 }
      ],
      medium: [
        { question: "12 + 15", answer: "27", timeLimit: 7 },
        { question: "25 - 13", answer: "12", timeLimit: 7 },
        { question: "4 × 5", answer: "20", timeLimit: 7 },
        { question: "18 + 7", answer: "25", timeLimit: 7 },
        { question: "30 - 12", answer: "18", timeLimit: 7 }
      ],
      hard: [
        { question: "45 + 38", answer: "83", timeLimit: 10 },
        { question: "72 - 29", answer: "43", timeLimit: 10 },
        { question: "7 × 8", answer: "56", timeLimit: 10 },
        { question: "125 + 67", answer: "192", timeLimit: 10 },
        { question: "100 - 37", answer: "63", timeLimit: 10 }
      ]
    },
    pictureQuiz: [
      { emoji: "🐶", name: "dog", category: "animal", hint: "Man's best friend, barks" },
      { emoji: "🐱", name: "cat", category: "animal", hint: "Says meow, loves milk" },
      { emoji: "🍎", name: "apple", category: "fruit", hint: "Red or green, keeps doctor away" },
      { emoji: "🚗", name: "car", category: "vehicle", hint: "Has wheels, takes you places" },
      { emoji: "🌞", name: "sun", category: "nature", hint: "Shines in the sky, gives light" },
      { emoji: "🌙", name: "moon", category: "nature", hint: "Comes out at night, glows" },
      { emoji: "⭐", name: "star", category: "nature", hint: "Twinkles in the night sky" },
      { emoji: "🌸", name: "flower", category: "nature", hint: "Beautiful, smells nice" },
      { emoji: "🎈", name: "balloon", category: "object", hint: "Floats, for parties" },
      { emoji: "🎂", name: "cake", category: "food", hint: "Sweet, for birthdays" },
      { emoji: "🎁", name: "gift", category: "object", hint: "Present with ribbon" },
      { emoji: "🏠", name: "house", category: "building", hint: "Where you live" }
    ],
    wordChain: {
      easy: [
        { start: "cat", chain: ["cat", "tiger", "rabbit", "hat", "tree"], hints: ["A small pet", "A big striped cat", "Hops and has long ears", "Worn on head", "Has leaves"] },
        { start: "sun", chain: ["sun", "night", "tiger", "red", "dog"], hints: ["In the sky, gives light", "When moon is out", "Big cat", "A color", "Barks"] }
      ],
      medium: [
        { start: "blue", chain: ["blue", "umbrella", "apple", "elephant", "tree"], hints: ["Sky color", "Keeps you dry from rain", "Red fruit", "Big animal with trunk", "Has leaves and bark"] },
        { start: "green", chain: ["green", "night", "train", "nest", "tiger"], hints: ["Grass color", "When stars come out", "Choo choo vehicle", "Birds live here", "Striped big cat"] }
      ]
    },
    countingGame: [
      { items: ["🍎", "🍎", "🍎"], count: 3, question: "How many apples?" },
      { items: ["⭐", "⭐", "⭐", "⭐", "⭐"], count: 5, question: "How many stars?" },
      { items: ["🐱", "🐱", "🐱", "🐱"], count: 4, question: "How many cats?" },
      { items: ["🌸", "🌸", "🌸", "🌸", "🌸", "🌸"], count: 6, question: "How many flowers?" },
      { items: ["🎈", "🎈"], count: 2, question: "How many balloons?" },
      { items: ["🍪", "🍪", "🍪", "🍪", "🍪", "🍪", "🍪", "🍪"], count: 8, question: "How many cookies?" }
    ],
    matchingGame: [
      { id: 1, emoji: "🐶", name: "dog", pair: "A" },
      { id: 2, emoji: "🐱", name: "cat", pair: "B" },
      { id: 3, emoji: "🍎", name: "apple", pair: "C" },
      { id: 4, emoji: "⭐", name: "star", pair: "D" },
      { id: 5, emoji: "🌙", name: "moon", pair: "E" },
      { id: 6, emoji: "🌸", name: "flower", pair: "F" },
      { id: 7, emoji: "🎈", name: "balloon", pair: "G" },
      { id: 8, emoji: "🎂", name: "cake", pair: "H" }
    ],
    // GAME POWER-UPS AND HELPERS
    powerUps: {
      timeFreeze: { name: "Time Freeze", emoji: "⏱️", description: "Stops timer for 10 seconds", cost: 50 },
      doublePoints: { name: "Double Points", emoji: "2️⃣", description: "Next answer worth double", cost: 30 },
      hint: { name: "Hint", emoji: "💡", description: "Get a helpful hint", cost: 20 },
      skip: { name: "Skip", emoji: "⏭️", description: "Skip this question", cost: 40 },
      extraLife: { name: "Extra Life", emoji: "❤️", description: "Continue after wrong answer", cost: 60 }
    },
    // THERAPY SYSTEM: Goals and Session Management
    therapyGoals: {
      cognitive: {
        title: "Cognitive Development",
        icon: "🧠",
        color: "#9B59B6",
        description: "Enhance thinking, reasoning, and problem-solving abilities",
        goals: [
          { id: "cog-1", title: "Problem Solver", target: 10, unit: "riddles solved", gameType: "riddles" },
          { id: "cog-2", title: "Pattern Master", target: 15, unit: "patterns completed", gameType: "patterns" },
          { id: "cog-3", title: "Memory Champion", target: 20, unit: "memory items matched", gameType: "memory" },
          { id: "cog-4", title: "Logic Expert", target: 10, unit: "math problems solved", gameType: "math" }
        ]
      },
      language: {
        title: "Language & Communication",
        icon: "💬",
        color: "#3498DB",
        description: "Build vocabulary, spelling, and communication skills",
        goals: [
          { id: "lang-1", title: "Spelling Star", target: 15, unit: "words spelled correctly", gameType: "spelling" },
          { id: "lang-2", title: "Word Wizard", target: 10, unit: "scrambles solved", gameType: "wordScramble" },
          { id: "lang-3", title: "Vocabulary Builder", target: 20, unit: "trivia questions answered", gameType: "trivia" }
        ]
      },
      sensory: {
        title: "Sensory Processing",
        icon: "👂",
        color: "#E74C3C",
        description: "Develop auditory, visual, and tactile discrimination",
        goals: [
          { id: "sens-1", title: "Sound Detective", target: 15, unit: "animal sounds matched", gameType: "animalSounds" },
          { id: "sens-2", title: "Color Expert", target: 20, unit: "colors identified", gameType: "colors" },
          { id: "sens-3", title: "Shape Spotter", target: 15, unit: "shapes recognized", gameType: "shapes" }
        ]
      },
      social: {
        title: "Social & Emotional",
        icon: "❤️",
        color: "#E91E63",
        description: "Build confidence, patience, and emotional regulation",
        goals: [
          { id: "soc-1", title: "Streak Master", target: 5, unit: "answer streaks of 5+", gameType: "any" },
          { id: "soc-2", title: "Daily Champion", target: 7, unit: "consecutive days", gameType: "daily" },
          { id: "soc-3", title: "High Scorer", target: 50, unit: "points in one session", gameType: "any" }
        ]
      },
      motor: {
        title: "Motor Skills",
        icon: "🎯",
        color: "#27AE60",
        description: "Improve hand-eye coordination and response time",
        goals: [
          { id: "motor-1", title: "Quick Responder", target: 20, unit: "fast answers", gameType: "any" },
          { id: "motor-2", title: "Accuracy Pro", target: 80, unit: "% accuracy", gameType: "any" }
        ]
      }
    },
    // THERAPY SESSIONS: Structured 20-30 minute sessions
    therapySessions: {
      focus: {
        title: "Focus & Attention",
        duration: 20,
        color: "#FF6B6B",
        icon: "🎯",
        description: "Activities designed to improve concentration and sustained attention",
        activities: [
          { type: "memory", duration: 5, goal: "Match 4 memory pairs" },
          { type: "patterns", duration: 5, goal: "Complete 3 pattern sequences" },
          { type: "colors", duration: 5, goal: "Identify 10 colors" },
          { type: "breathing", duration: 5, goal: "Calm breathing exercise" }
        ],
        rewards: ["Focus Star", "Concentration Badge"]
      },
      communication: {
        title: "Communication Skills",
        duration: 25,
        color: "#4ECDC4",
        icon: "💬",
        description: "Build language skills through interactive games",
        activities: [
          { type: "spelling", duration: 8, goal: "Spell 5 words correctly" },
          { type: "animalSounds", duration: 7, goal: "Match 5 animal sounds" },
          { type: "wordScramble", duration: 5, goal: "Unscramble 3 words" },
          { type: "story", duration: 5, goal: "Listen to interactive story" }
        ],
        rewards: ["Word Wizard", "Communication Pro"]
      },
      logic: {
        title: "Logic & Reasoning",
        duration: 25,
        color: "#9B59B6",
        icon: "🧩",
        description: "Develop critical thinking and problem-solving abilities",
        activities: [
          { type: "riddles", duration: 10, goal: "Solve 3 riddles" },
          { type: "math", duration: 10, goal: "Answer 5 math questions" },
          { type: "trivia", duration: 5, goal: "Answer 3 trivia questions" }
        ],
        rewards: ["Logic Master", "Brain Champion"]
      },
      calm: {
        title: "Calm & Relax",
        duration: 20,
        color: "#84FAB0",
        icon: "🧘",
        description: "Soothing activities for emotional regulation",
        activities: [
          { type: "music", duration: 10, goal: "Listen to calming music" },
          { type: "breathing", duration: 5, goal: "Deep breathing exercise" },
          { type: "colors", duration: 5, goal: "Color matching calm game" }
        ],
        rewards: ["Zen Master", "Calm Champion"]
      },
      comprehensive: {
        title: "Comprehensive Development",
        duration: 30,
        color: "#FFD93D",
        icon: "⭐",
        description: "Full spectrum session covering all skill areas",
        activities: [
          { type: "memory", duration: 5, goal: "Memory challenge" },
          { type: "spelling", duration: 5, goal: "Spelling challenge" },
          { type: "riddles", duration: 5, goal: "Riddle solving" },
          { type: "shapes", duration: 5, goal: "Shape recognition" },
          { type: "patterns", duration: 5, goal: "Pattern completion" },
          { type: "breathing", duration: 5, goal: "Relaxation" }
        ],
        rewards: ["All-Rounder", "Therapy Star"]
      }
    },
    // THERAPY PROGRESS TRACKING
    therapyProgress: {
      levels: [
        { level: 1, title: "Beginner", minScore: 0, color: "#95A5A6" },
        { level: 2, title: "Explorer", minScore: 100, color: "#3498DB" },
        { level: 3, title: "Learner", minScore: 300, color: "#2ECC71" },
        { level: 4, title: "Achiever", minScore: 600, color: "#9B59B6" },
        { level: 5, title: "Expert", minScore: 1000, color: "#E91E63" },
        { level: 6, title: "Master", minScore: 1500, color: "#FFD700" }
      ],
      milestones: [
        { id: "first-game", title: "First Steps", description: "Complete your first game", icon: "👣", points: 10 },
        { id: "streak-3", title: "On Fire", description: "Get 3 correct answers in a row", icon: "🔥", points: 20 },
        { id: "streak-5", title: "Unstoppable", description: "Get 5 correct answers in a row", icon: "⚡", points: 50 },
        { id: "daily-7", title: "Weekly Warrior", description: "Play for 7 days straight", icon: "📅", points: 100 },
        { id: "all-games", title: "Game Master", description: "Try all 10 game types", icon: "🏆", points: 150 },
        { id: "high-score", title: "High Scorer", description: "Score 50+ points in one game", icon: "💎", points: 75 },
        { id: "therapy-complete", title: "Therapy Champion", description: "Complete 10 therapy sessions", icon: "🎖️", points: 200 },
        { id: "focus-master", title: "Focus Master", description: "Complete 5 Focus sessions", icon: "🎯", points: 100 }
      ]
    },
    // INTERACTIVE STORY MODE - Choose Your Adventure
    interactiveStories: [
      {
        id: "adventure-forest",
        title: "The Magic Forest Adventure",
        description: "Help Lily find her way through the enchanted forest!",
        theme: "adventure",
        color: "#27AE60",
        icon: "🌲",
        scenes: [
          {
            id: "start",
            text: "Lily stands at the edge of a magical forest. She sees two paths: one leads to a sparkling river, the other to a giant tree with a door.",
            choices: [
              { text: "Go to the river 🌊", next: "river", emoji: "🌊" },
              { text: "Visit the giant tree 🌳", next: "tree", emoji: "🌳" }
            ]
          },
          {
            id: "river",
            text: "At the river, Lily sees talking fish! They offer her a golden scale that grants one wish, OR they can teach her to swim like a mermaid.",
            choices: [
              { text: "Take the golden scale ✨", next: "wish", emoji: "✨" },
              { text: "Learn to swim 🧜‍♀️", next: "mermaid", emoji: "🧜‍♀️" }
            ]
          },
          {
            id: "tree",
            text: "The tree door opens to reveal a wise old owl! He offers to teach her forest magic OR give her a map to hidden treasure.",
            choices: [
              { text: "Learn forest magic 🪄", next: "magic", emoji: "🪄" },
              { text: "Get treasure map 🗺️", next: "treasure", emoji: "🗺️" }
            ]
          },
          {
            id: "wish",
            text: "Lily wishes for the forest animals to always be happy! The forest glows with joy, and the animals crown her 'Friend of the Forest'! 🎉",
            ending: true,
            reward: { type: "badge", name: "Forest Guardian", icon: "🌲" }
          },
          {
            id: "mermaid",
            text: "Lily learns to swim beautifully! She discovers an underwater kingdom and becomes friends with the mermaid princess! 🧜‍♀️✨",
            ending: true,
            reward: { type: "badge", name: "Mermaid Friend", icon: "🧜‍♀️" }
          },
          {
            id: "magic",
            text: "Lily learns to talk to animals! She helps solve problems in the forest and becomes the youngest Forest Wizard ever! 🧙‍♀️",
            ending: true,
            reward: { type: "badge", name: "Forest Wizard", icon: "🪄" }
          },
          {
            id: "treasure",
            text: "Lily finds treasure - but it's not gold! It's a library of magical books! She becomes the Forest Librarian! 📚✨",
            ending: true,
            reward: { type: "badge", name: "Treasure Finder", icon: "💎" }
          }
        ]
      },
      {
        id: "space-mission",
        title: "Captain Star's Space Mission",
        description: "Help Captain Star explore the galaxy!",
        theme: "space",
        color: "#9B59B6",
        icon: "🚀",
        scenes: [
          {
            id: "start",
            text: "Captain Star's rocket is ready! Should we visit the Moon with its cheese caves or Mars with its red canyons?",
            choices: [
              { text: "Fly to the Moon 🌙", next: "moon", emoji: "🌙" },
              { text: "Explore Mars 🔴", next: "mars", emoji: "🔴" }
            ]
          },
          {
            id: "moon",
            text: "On the Moon, you find moon bunnies having a tea party! They offer you moon cheese OR a ride on a moon rabbit!",
            choices: [
              { text: "Try moon cheese 🧀", next: "cheese", emoji: "🧀" },
              { text: "Ride moon rabbit 🐰", next: "rabbit", emoji: "🐰" }
            ]
          },
          {
            id: "mars",
            text: "On Mars, friendly robots are building a playground! They need help designing a slide OR a swing set.",
            choices: [
              { text: "Design a slide 🛝", next: "slide", emoji: "🛝" },
              { text: "Build swings 🎢", next: "swings", emoji: "🎢" }
            ]
          },
          {
            id: "cheese",
            text: "The moon cheese gives you super jumping powers! You can now jump between stars! You're the Moon Jumper! 🌟",
            ending: true,
            reward: { type: "badge", name: "Moon Jumper", icon: "🌙" }
          },
          {
            id: "rabbit",
            text: "The moon rabbit hops so high, you see all the planets! You discover a new star and name it after yourself! ⭐",
            ending: true,
            reward: { type: "badge", name: "Star Discoverer", icon: "⭐" }
          },
          {
            id: "slide",
            text: "Your slide design is amazing! Aliens from all over the galaxy come to play! You're the Galaxy Architect! 🏗️",
            ending: true,
            reward: { type: "badge", name: "Galaxy Architect", icon: "🚀" }
          },
          {
            id: "swings",
            text: "The swings are the best in the galaxy! You swing so high you touch a comet's tail! You're the Comet Rider! ☄️",
            ending: true,
            reward: { type: "badge", name: "Comet Rider", icon: "☄️" }
          }
        ]
      },
      {
        id: "ocean-quest",
        title: "The Ocean Explorer's Quest",
        description: "Dive deep and discover ocean secrets!",
        theme: "ocean",
        color: "#3498DB",
        icon: "🐠",
        scenes: [
          {
            id: "start",
            text: "You're in a submarine at the ocean's edge! Do you want to explore the coral reef OR the deep dark trench?",
            choices: [
              { text: "Visit coral reef 🪸", next: "reef", emoji: "🪸" },
              { text: "Dive deep trench 🌊", next: "trench", emoji: "🌊" }
            ]
          },
          {
            id: "reef",
            text: "The coral reef is full of colorful fish! A clownfish family invites you to their home OR a dolphin wants to race!",
            choices: [
              { text: "Visit fish family 🐠", next: "fish", emoji: "🐠" },
              { text: "Race dolphin 🐬", next: "dolphin", emoji: "🐬" }
            ]
          },
          {
            id: "trench",
            text: "In the deep trench, you meet a glowing anglerfish! It offers to show you hidden treasures OR teach you bioluminescence.",
            choices: [
              { text: "See treasures 💎", next: "treasure", emoji: "💎" },
              { text: "Learn to glow ✨", next: "glow", emoji: "✨" }
            ]
          },
          {
            id: "fish",
            text: "The fish family teaches you their secret language! You can now help sea creatures communicate! 🐠💬",
            ending: true,
            reward: { type: "badge", name: "Ocean Translator", icon: "🐠" }
          },
          {
            id: "dolphin",
            text: "You race and win! The dolphins make you an honorary pod member! You get to swim with them every day! 🐬🏆",
            ending: true,
            reward: { type: "badge", name: "Dolphin Champion", icon: "🐬" }
          },
          {
            id: "treasure",
            text: "You discover ancient ocean artifacts! You're now the Ocean Museum's youngest curator! 🏛️🐚",
            ending: true,
            reward: { type: "badge", name: "Treasure Curator", icon: "🏛️" }
          },
          {
            id: "glow",
            text: "You learn to glow like sea creatures! At night, you light up the ocean and guide lost ships safely! 🚢✨",
            ending: true,
            reward: { type: "badge", name: "Ocean Light", icon: "💡" }
          }
        ]
      }
    ],
    // REWARD SHOP SYSTEM
    rewardShop: {
      currency: { name: "Star Points", icon: "⭐", symbol: "★" },
      categories: [
        { id: "avatars", name: "Avatars", icon: "👤" },
        { id: "stickers", name: "Stickers", icon: "🏷️" },
        { id: "themes", name: "Themes", icon: "🎨" },
        { id: "badges", name: "Badges", icon: "🎖️" },
        { id: "effects", name: "Effects", icon: "✨" }
      ],
      items: [
        // Avatars
        { id: "avatar-lion", name: "Brave Lion", category: "avatars", price: 100, icon: "🦁", description: "Roar with courage!" },
        { id: "avatar-unicorn", name: "Magic Unicorn", category: "avatars", price: 200, icon: "🦄", description: "Sparkle and shine!" },
        { id: "avatar-dragon", name: "Fire Dragon", category: "avatars", price: 300, icon: "🐲", description: "Breathe fire!" },
        { id: "avatar-alien", name: "Space Alien", category: "avatars", price: 150, icon: "👽", description: "From another planet!" },
        { id: "avatar-robot", name: "Cool Robot", category: "avatars", price: 150, icon: "🤖", description: "Beep boop!" },
        { id: "avatar-ninja", name: "Silent Ninja", category: "avatars", price: 250, icon: "🥷", description: "Swift and silent!" },
        { id: "avatar-princess", name: "Royal Princess", category: "avatars", price: 200, icon: "👸", description: "Rule with kindness!" },
        { id: "avatar-astronaut", name: "Space Explorer", category: "avatars", price: 250, icon: "👨‍🚀", description: "Reach for the stars!" },
        // Stickers
        { id: "sticker-rainbow", name: "Rainbow Pack", category: "stickers", price: 50, icon: "🌈", description: "10 rainbow stickers" },
        { id: "sticker-animals", name: "Animal Pack", category: "stickers", price: 75, icon: "🐾", description: "15 animal stickers" },
        { id: "sticker-space", name: "Space Pack", category: "stickers", price: 75, icon: "🚀", description: "12 space stickers" },
        { id: "sticker-hearts", name: "Heart Pack", category: "stickers", price: 50, icon: "💕", description: "20 heart stickers" },
        // Themes
        { id: "theme-ocean", name: "Ocean Blue", category: "themes", price: 300, icon: "🌊", description: "Underwater theme" },
        { id: "theme-forest", name: "Forest Green", category: "themes", price: 300, icon: "🌲", description: "Nature theme" },
        { id: "theme-galaxy", name: "Galaxy Purple", category: "themes", price: 400, icon: "🌌", description: "Space theme" },
        { id: "theme-sunset", name: "Sunset Orange", category: "themes", price: 300, icon: "🌅", description: "Warm sunset theme" },
        // Effects
        { id: "effect-sparkle", name: "Sparkle Trail", category: "effects", price: 200, icon: "✨", description: "Leave sparkles behind!" },
        { id: "effect-rainbow", name: "Rainbow Path", category: "effects", price: 250, icon: "🌈", description: "Rainbow follows you!" },
        { id: "effect-bubbles", name: "Bubble Float", category: "effects", price: 150, icon: "🫧", description: "Float with bubbles!" }
      ]
    },
    // DAILY CHALLENGES
    dailyChallenges: {
      lastUpdated: null, // Will be set to current date
      challenges: [
        { id: "daily-1", title: "Speed Demon", description: "Answer 5 questions in under 30 seconds", reward: 50, icon: "⚡", type: "speed" },
        { id: "daily-2", title: "Perfect Score", description: "Get 10 answers correct in a row", reward: 75, icon: "🎯", type: "accuracy" },
        { id: "daily-3", title: "Game Explorer", description: "Try 3 different types of games", reward: 60, icon: "🎮", type: "exploration" },
        { id: "daily-4", title: "Memory Master", description: "Complete 2 memory games", reward: 40, icon: "🧠", type: "memory" },
        { id: "daily-5", title: "Word Wizard", description: "Spell 5 words correctly", reward: 50, icon: "✍️", type: "spelling" },
        { id: "daily-6", title: "Math Genius", description: "Solve 5 math problems", reward: 50, icon: "🔢", type: "math" },
        { id: "daily-7", title: "Story Time", description: "Listen to or read 2 stories", reward: 30, icon: "📚", type: "reading" },
        { id: "daily-8", title: "Song Bird", description: "Sing along with 2 songs", reward: 30, icon: "🎵", type: "music" },
        { id: "daily-9", title: "Calm Master", description: "Do 1 breathing exercise", reward: 40, icon: "🧘", type: "mindfulness" },
        { id: "daily-10", title: "Helper Hero", description: "Complete 1 therapy session", reward: 100, icon: "🦸", type: "therapy" }
      ],
      streakBonus: { 3: 25, 7: 50, 14: 100, 30: 250 }
    },
    // SOUND EFFECTS LIBRARY
    soundEffects: {
      enabled: true,
      volume: 0.7,
      categories: {
        success: [
          { id: "success-1", name: "Success Bell", file: "bell.mp3", icon: "🔔" },
          { id: "success-2", name: "Happy Chime", file: "chime.mp3", icon: "🎵" },
          { id: "success-3", name: "Victory Fanfare", file: "fanfare.mp3", icon: "🎺" },
          { id: "success-4", name: "Magic Sparkle", file: "sparkle.mp3", icon: "✨" }
        ],
        correct: [
          { id: "correct-1", name: "Ding", file: "ding.mp3", icon: "✅" },
          { id: "correct-2", name: "Pop", file: "pop.mp3", icon: "🎈" },
          { id: "correct-3", name: "Cheer", file: "cheer.mp3", icon: "📣" }
        ],
        wrong: [
          { id: "wrong-1", name: "Soft Buzz", file: "buzz.mp3", icon: "❌" },
          { id: "wrong-2", name: "Gentle Thud", file: "thud.mp3", icon: "💭" },
          { id: "wrong-3", name: "Try Again", file: "tryagain.mp3", icon: "🔄" }
        ],
        click: [
          { id: "click-1", name: "Click", file: "click.mp3", icon: "👆" },
          { id: "click-2", name: "Pop Click", file: "popclick.mp3", icon: "💫" },
          { id: "click-3", name: "Soft Tap", file: "tap.mp3", icon: "👋" }
        ],
        celebration: [
          { id: "celebrate-1", name: "Applause", file: "applause.mp3", icon: "👏" },
          { id: "celebrate-2", name: "Confetti", file: "confetti.mp3", icon: "🎉" },
          { id: "celebrate-3", name: "Tada", file: "tada.mp3", icon: "🎊" }
        ],
        ambient: [
          { id: "ambient-1", name: "Forest Birds", file: "birds.mp3", icon: "🐦" },
          { id: "ambient-2", name: "Ocean Waves", file: "ocean.mp3", icon: "🌊" },
          { id: "ambient-3", name: "Gentle Rain", file: "rain.mp3", icon: "🌧️" },
          { id: "ambient-4", name: "Wind Chimes", file: "chimes.mp3", icon: "🎐" }
        ]
      }
    },
    // AVATAR CUSTOMIZATION
    avatarParts: {
      base: [
        { id: "base-circle", name: "Circle", icon: "⭕", colorable: true },
        { id: "base-square", name: "Square", icon: "⬜", colorable: true },
        { id: "base-star", name: "Star", icon: "⭐", colorable: true },
        { id: "base-heart", name: "Heart", icon: "❤️", colorable: true },
        { id: "base-cloud", name: "Cloud", icon: "☁️", colorable: false }
      ],
      eyes: [
        { id: "eyes-happy", name: "Happy", icon: "😊" },
        { id: "eyes-wink", name: "Wink", icon: "😉" },
        { id: "eyes-big", name: "Big Eyes", icon: "🥺" },
        { id: "eyes-cool", name: "Cool", icon: "😎" },
        { id: "eyes-sleepy", name: "Sleepy", icon: "😴" },
        { id: "eyes-star", name: "Star Eyes", icon: "🤩" }
      ],
      mouth: [
        { id: "mouth-smile", name: "Smile", icon: "🙂" },
        { id: "mouth-big", name: "Big Smile", icon: "😃" },
        { id: "mouth-open", name: "Open", icon: "😮" },
        { id: "mouth-tongue", name: "Silly", icon: "😜" },
        { id: "mouth-love", name: "Love", icon: "😘" }
      ],
      accessories: [
        { id: "acc-none", name: "None", icon: "❌", price: 0 },
        { id: "acc-glasses", name: "Glasses", icon: "👓", price: 50 },
        { id: "acc-sunglasses", name: "Sunglasses", icon: "🕶️", price: 75 },
        { id: "acc-hat", name: "Hat", icon: "🎩", price: 60 },
        { id: "acc-crown", name: "Crown", icon: "👑", price: 100 },
        { id: "acc-bow", name: "Bow", icon: "🎀", price: 50 },
        { id: "acc-headphones", name: "Headphones", icon: "🎧", price: 80 },
        { id: "acc-birthday", name: "Party Hat", icon: "🥳", price: 40 }
      ],
      colors: [
        { id: "color-red", name: "Cherry", hex: "#FF6B6B" },
        { id: "color-orange", name: "Orange", hex: "#FFD93D" },
        { id: "color-yellow", name: "Lemon", hex: "#FFF59D" },
        { id: "color-green", name: "Lime", hex: "#6BCF7F" },
        { id: "color-blue", name: "Ocean", hex: "#4D96FF" },
        { id: "color-purple", name: "Grape", hex: "#9B59B6" },
        { id: "color-pink", name: "Bubblegum", hex: "#FF9A9E" },
        { id: "color-teal", name: "Teal", hex: "#4ECDC4" }
      ]
    },
    // ENHANCED VOICE COMMANDS
    voiceCommands: {
      games: [
        { command: "play memory", action: "startGame('memory')" },
        { command: "play spelling", action: "startGame('spelling')" },
        { command: "play riddles", action: "startGame('riddles')" },
        { command: "play math", action: "startGame('math')" },
        { command: "play colors", action: "startGame('colors')" },
        { command: "play shapes", action: "startGame('shapes')" },
        { command: "play patterns", action: "startGame('patterns')" },
        { command: "play trivia", action: "startGame('trivia')" },
        { command: "play animals", action: "startGame('animalSounds')" },
        { command: "play words", action: "startGame('wordScramble')" }
      ],
      content: [
        { command: "sing a song", action: "singSong()" },
        { command: "tell a story", action: "tellStory()" },
        { command: "read a poem", action: "readPoem()" },
        { command: "read a book", action: "readBook()" },
        { command: "start story mode", action: "startInteractiveStory()" }
      ],
      therapy: [
        { command: "start focus session", action: "startTherapySession('focus')" },
        { command: "start calm session", action: "startTherapySession('calm')" },
        { command: "start communication session", action: "startTherapySession('communication')" },
        { command: "start logic session", action: "startTherapySession('logic')" },
        { command: "start full session", action: "startTherapySession('comprehensive')" },
        { command: "breathing exercise", action: "startBreathing()" },
        { command: "show my goals", action: "showGoals()" },
        { command: "show my progress", action: "showProgress()" }
      ],
      shop: [
        { command: "open shop", action: "openShop()" },
        { command: "check my points", action: "showCurrency()" },
        { command: "change my avatar", action: "openAvatarCreator()" }
      ],
      system: [
        { command: "help", action: "showHelp()" },
        { command: "what can I do", action: "showHelp()" },
        { command: "daily challenges", action: "showDailyChallenges()" },
        { command: "my achievements", action: "showAchievements()" },
        { command: "turn on sounds", action: "enableSounds()" },
        { command: "turn off sounds", action: "disableSounds()" }
      ]
    },
    // AI-POWERED DYNAMIC GAME SYSTEM
    aiSystem: {
      enabled: true,
      difficultyLevels: {
        easy: { range: [1, 5], label: "Easy", emoji: "🌱" },
        medium: { range: [6, 10], label: "Medium", emoji: "🌿" },
        hard: { range: [11, 15], label: "Hard", emoji: "🌳" },
        expert: { range: [16, 20], label: "Expert", emoji: "⭐" }
      },
      adaptiveSettings: {
        performanceThresholds: {
          promote: 0.8, // 80% correct to level up
          demote: 0.4,  // 40% correct to level down
          minQuestions: 5 // Minimum questions before adjusting
        },
        learningStyles: {
          visual: { prefers: ["colors", "shapes", "patterns"], hints: "Show me pictures" },
          auditory: { prefers: ["animalSounds", "songs", "stories"], hints: "Tell me more" },
          kinesthetic: { prefers: ["memory", "trivia", "math"], hints: "Let me try" },
          reading: { prefers: ["spelling", "wordScramble", "riddles"], hints: "Read it out" }
        }
      },
      // AI Content Generators
      generators: {
        // Dynamic Math Problems
        generateMathProblem: (difficulty, type = "mixed") => {
          const ops = type === "mixed" ? ["+", "-", "*"] : [type];
          const op = ops[Math.floor(Math.random() * ops.length)];
          let a, b, answer;
          
          switch(difficulty) {
            case "easy":
              a = Math.floor(Math.random() * 10) + 1;
              b = Math.floor(Math.random() * 10) + 1;
              break;
            case "medium":
              a = Math.floor(Math.random() * 50) + 10;
              b = Math.floor(Math.random() * 20) + 1;
              break;
            case "hard":
              a = Math.floor(Math.random() * 100) + 20;
              b = Math.floor(Math.random() * 50) + 10;
              break;
            case "expert":
              a = Math.floor(Math.random() * 500) + 100;
              b = Math.floor(Math.random() * 100) + 50;
              break;
          }
          
          switch(op) {
            case "+": answer = a + b; break;
            case "-": answer = a - b; break;
            case "*": answer = a * b; break;
          }
          
          return {
            question: `What is ${a} ${op} ${b}?`,
            answer: answer.toString(),
            difficulty,
            hints: [
              `Think about counting ${op === "+" ? "up" : op === "-" ? "down" : "in groups"}`,
              `Try breaking it into smaller ${op === "*" ? "additions" : "steps"}`,
              `Remember: ${a} ${op} ${b} = ?`
            ]
          };
        },
        
        // Dynamic Spelling Words
        generateSpellingWord: (difficulty) => {
          const wordLists = {
            easy: ["cat", "dog", "sun", "hat", "run", "fun", "big", "red", "blue", "happy"],
            medium: ["apple", "house", "water", "friend", "school", "family", "garden", "summer", "winter", "spring"],
            hard: ["beautiful", "wonderful", "adventure", "butterfly", "rainbow", "mountain", "ocean", "diamond", "treasure", "magical"],
            expert: ["extraordinary", "imagination", "celebration", "exploration", "constellation", "butterflies", "adventurous", "magnificent", "breathtaking", "unstoppable"]
          };
          
          const words = wordLists[difficulty];
          const word = words[Math.floor(Math.random() * words.length)];
          
          return {
            word,
            hint: `This word has ${word.length} letters. It starts with "${word[0]}" and ends with "${word[word.length-1]}"`,
            phonetic: word.split("").join("-"),
            difficulty
          };
        },
        
        // Dynamic Riddles
        generateRiddle: (difficulty) => {
          const riddles = {
            easy: [
              { q: "I have keys but no locks. What am I?", a: "piano", hint: "You play me with fingers" },
              { q: "What has a face and two hands but no arms?", a: "clock", hint: "It tells you the time" },
              { q: "What has to be broken before you can use it?", a: "egg", hint: "Breakfast food" },
              { q: "What gets wetter the more it dries?", a: "towel", hint: "You use it after a bath" }
            ],
            medium: [
              { q: "The more you take, the more you leave behind. What am I?", a: "footsteps", hint: "You make these when walking" },
              { q: "What has cities but no houses?", a: "map", hint: "You use it to find directions" },
              { q: "What can travel around the world while staying in a corner?", a: "stamp", hint: "You put it on letters" },
              { q: "What has a head, a tail, but no body?", a: "coin", hint: "You flip it to make decisions" }
            ],
            hard: [
              { q: "I speak without a mouth and hear without ears. What am I?", a: "echo", hint: "Sound bouncing back" },
              { q: "The more of me you remove, the bigger I get. What am I?", a: "hole", hint: "Empty space in something" },
              { q: "What has one eye but cannot see?", a: "needle", hint: "Used for sewing" },
              { q: "What belongs to you but others use it more?", a: "name", hint: "What people call you" }
            ],
            expert: [
              { q: "I have branches but no fruit, trunk but no bark. What am I?", a: "bank", hint: "Where you keep money" },
              { q: "The person who makes me sells me. The person who buys me never uses me. What am I?", a: "coffin", hint: "Final resting place" },
              { q: "What goes up but never comes down?", a: "age", hint: "You gain one every birthday" },
              { q: "What is always in front of you but can't be seen?", a: "future", hint: "What comes next" }
            ]
          };
          
          const pool = riddles[difficulty];
          return pool[Math.floor(Math.random() * pool.length)];
        },
        
        // AI Hints System
        generateHint: (gameType, question, wrongAttempts) => {
          const hintLevels = [
            "Think carefully about the question",
            "Look for clues in the words",
            "Try breaking it into smaller parts",
            "Consider what you already know"
          ];
          
          const specificHints = {
            math: ["Count on your fingers", "Draw it out", "Use a number line", "Try adding instead"],
            spelling: ["Sound it out slowly", "Think of rhyming words", "Write it down", "Look at the letters"],
            memory: ["Focus on the colors", "Look for patterns", "Take your time", "Remember the position"],
            colors: ["Look around the room", "Think of rainbow colors", "What color is the sky?", "Fruits have colors"],
            shapes: ["Count the sides", "Look for corners", "Think about circles", "Compare to objects"]
          };
          
          const hints = specificHints[gameType] || hintLevels;
          return hints[Math.min(wrongAttempts, hints.length - 1)];
        }
      },
      
      // AI Companion Personality
      companion: {
        name: "Dhyan AI",
        personality: "friendly",
        moods: {
          encouraging: [
            "You're doing amazing! Keep going! 🌟",
            "I believe in you! You've got this! 💪",
            "Every try makes you smarter! 🧠",
            "You're a superstar learner! ⭐"
          ],
          helpful: [
            "Need a hint? I'm here to help! 💡",
            "Let's figure this out together! 🤝",
            "Take your time, no rush! ⏰",
            "Think step by step with me! 👣"
          ],
          celebratory: [
            "WOW! You're incredible! 🎉",
            "That was perfect! Amazing work! 🏆",
            "You're on fire! Keep it up! 🔥",
            "Brilliant! You're so clever! ✨"
          ],
          supportive: [
            "It's okay to make mistakes! 💙",
            "Learning takes time, you're doing great! 🌱",
            "Don't give up! You're getting better! 🌈",
            "Mistakes help us learn! Try again! 🔄"
          ]
        },
        
        // AI Response Generator
        generateResponse: (context) => {
          const { performance, streak, gameType, difficulty } = context;
          
          if (performance === "excellent") {
            return `Fantastic! You're a ${gameType} master at ${difficulty} level! 🏆`;
          } else if (performance === "good") {
            return `Great job! ${streak > 2 ? `${streak} in a row!` : "Keep it up!"} 💪`;
          } else if (performance === "struggling") {
            return "Let me help you! Would you like a hint? 💡";
          } else {
            return "Every try makes you stronger! Don't give up! 🌟";
          }
        }
      }
    }
  }
};

// Voice Agent with Full Interactive System
function VoiceAgent({ userName, stats }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [emotion, setEmotion] = useState("happy");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [currentMode, setCurrentMode] = useState("chat"); // chat, song, poem, story, book, game
  const [currentContent, setCurrentContent] = useState(null);
  const [contentIndex, setContentIndex] = useState(0);
  
  // NEW: Enhanced Game State with Timer and Power-ups
  const [gameState, setGameState] = useState({
    isPlaying: false,
    type: null,
    currentQuestion: null,
    score: 0,
    streak: 0,
    questionsAnswered: 0,
    waitingForAnswer: false,
    difficulty: 'easy',
    // NEW: Timer system
    timeRemaining: 0,
    totalTime: 0,
    timerActive: false,
    // NEW: Power-ups
    powerUps: {
      timeFreeze: 0,
      doublePoints: 0,
      hint: 0,
      skip: 0,
      extraLife: 0
    },
    activePowerUp: null,
    // NEW: Game stats
    wrongAttempts: 0,
    hintsUsed: 0,
    startTime: null,
    endTime: null
  });

  // ENHANCED: Achievement and reward system
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [particles, setParticles] = useState([]);

  // ENHANCED: Emoji reactions and mood
  const [currentMood, setCurrentMood] = useState("happy");
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // ENHANCED: Voice customization
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);

  // NEW: Daily Challenges System
  const [dailyChallenges, setDailyChallenges] = useState([
    { id: 1, title: "Answer 5 riddles", target: 5, current: 0, reward: "🏅 Riddle Master", completed: false },
    { id: 2, title: "Score 30 points", target: 30, current: 0, reward: "⭐ Point Collector", completed: false },
    { id: 3, title: "Play for 10 minutes", target: 10, current: 0, reward: "⏰ Time Keeper", completed: false }
  ]);
  const [showChallengeComplete, setShowChallengeComplete] = useState(null);

  // NEW: Streak Calendar System
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    weeklyProgress: [true, true, false, true, true, false, false] // Mon-Sun
  });
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  // NEW: Avatar Personalization
  const [selectedAvatar, setSelectedAvatar] = useState("🐰");
  const [avatarOptions] = useState(["🐰", "🐻", "🐱", "🐶", "🦁", "🐼", "🦄", "🦊"]);
  const [selectedTheme, setSelectedTheme] = useState("pink");
  const [themeOptions] = useState([
    { name: "pink", bg: "#fff5f7", accent: "#ff9a9e" },
    { name: "blue", bg: "#f0f9ff", accent: "#66a6ff" },
    { name: "green", bg: "#f0fff4", accent: "#84fab0" },
    { name: "purple", bg: "#faf5ff", accent: "#a18cd1" }
  ]);

  // NEW: Progress Tracking
  const [learningProgress, setLearningProgress] = useState({
    gamesPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    timeSpent: 0,
    subjects: { math: 0, reading: 0, logic: 0, memory: 0 }
  });

  // NEW: Breathing Exercise State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState("inhale"); // inhale, hold, exhale

  // NEW: AI Difficulty Tracking
  const [userSkillLevel, setUserSkillLevel] = useState({
    overall: 1, // 1-5
    math: 1,
    logic: 1,
    memory: 1
  });
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);

  // NEW: Story Creator State
  const [storyCreatorActive, setStoryCreatorActive] = useState(false);
  const [createdStory, setCreatedStory] = useState({
    character: null,
    setting: null,
    problem: null,
    resolution: null,
    fullStory: null
  });

  // NEW: Reward Shop State
  const [rewardShopOpen, setRewardShopOpen] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState({
    background: null,
    frame: null,
    badge: null
  });

  // NEW: Sound Effects System
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const audioContextRef = useRef(null);

  // NEW: Seasonal Content
  const [currentSeason, setCurrentSeason] = useState('spring'); // spring, summer, fall, winter
  const [seasonalContent, setSeasonalContent] = useState({
    spring: { theme: 'blossom', songs: [], colors: ['#FFB6C1', '#98FB98'] },
    summer: { theme: 'sunshine', songs: [], colors: ['#FFD700', '#87CEEB'] },
    fall: { theme: 'harvest', songs: [], colors: ['#FF8C00', '#8B4513'] },
    winter: { theme: 'snowflake', songs: [], colors: ['#E0FFFF', '#B0E0E6'] }
  });

  // NEW: Voice Emotion State
  const [detectedEmotion, setDetectedEmotion] = useState('neutral');
  const [emotionHistory, setEmotionHistory] = useState([]);

  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const autoPlayRef = useRef(false);

  // NEW: Audio playback for songs
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const audioRef = useRef(null);

  // NEW: Music Player State
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(false);

  // NEW: Confetti State
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  // NEW: Trigger Big Celebration
  const triggerCelebration = useCallback(() => {
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 100);
  }, []);

  // NEW: Wake word detection
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [showWakeWordIndicator, setShowWakeWordIndicator] = useState(false);
  const wakeWordTimeoutRef = useRef(null);

  // Add system log
  const addLog = useCallback((type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [...prev.slice(-9), { type, message, timestamp }]);
  }, []);

  // ENHANCED: Particle system for celebrations
  const createParticles = useCallback((x, y, type = 'confetti') => {
    const colors = ['#ff9a9e', '#fecfef', '#a18cd1', '#fbc2eb', '#84fab0', '#8fd3f4', '#fa709a', '#fee140'];
    const emojis = ['🎉', '⭐', '🎊', '✨', '🌟', '💫', '🎈', '🏆'];
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 100,
      y: y + (Math.random() - 0.5) * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: type === 'emoji' ? emojis[Math.floor(Math.random() * emojis.length)] : null,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: -5 - Math.random() * 10
      },
      life: 1.0
    }));
    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  }, []);

  // ENHANCED: Floating emoji animation
  const addFloatingEmoji = useCallback((emoji, mood = 'happy') => {
    const id = Date.now();
    const newEmoji = {
      id,
      emoji,
      x: 50 + Math.random() * 200,
      y: 100,
      mood
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  }, []);

  // FIX: Stop all speech MUST be defined BEFORE speak
  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    autoPlayRef.current = false;
  }, []);

  // OPTIMIZED: Cache preferred voice for faster speech
  const preferredVoiceRef = useRef(null);

  // OPTIMIZED: Speak with voice caching and faster settings - DEFINED EARLY
  const speak = useCallback((text, emotionType = "happy", onEndCallback = null) => {
    if (!synthRef.current) {
      addLog("error", "Speech synthesis not available");
      return;
    }

    stopSpeech();

    setEmotion(emotionType);
    setCurrentMessage(text);
    setIsSpeaking(true);
    addLog("info", `Speaking: ${text.slice(0, 30)}...`);

    const utterance = new SpeechSynthesisUtterance(text);
    // ENHANCED: Voice settings with user customization
    const baseRate = currentMode === "song" ? 0.9 : currentMode === "poem" ? 0.95 : currentMode === "story" ? 1.0 : 1.1;
    const basePitch = emotionType === "excited" ? 1.3 : emotionType === "thinking" ? 1.0 : emotionType === "story" ? 1.1 : emotionType === "celebrating" ? 1.25 : 1.15;

    utterance.rate = Math.max(0.5, Math.min(2.0, baseRate * voiceSpeed));
    utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch * voicePitch));
    utterance.volume = 0.95;

    // OPTIMIZED: Cache voice selection (only search once)
    if (!preferredVoiceRef.current) {
      const voices = synthRef.current.getVoices();
      preferredVoiceRef.current = voices.find(v =>
        v.name.includes("Samantha") ||
        v.name.includes("Google US English") ||
        v.name.includes("Microsoft Zira") ||
        v.name.includes("Victoria") ||
        v.name.includes("Karen")
      ) || voices.find(v => v.lang === "en-US" || v.lang === "en-GB");
    }
    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [addLog, stopSpeech, currentMode]);

  // ENHANCED: Achievement unlock system - DEFINED AFTER speak
  const unlockAchievement = useCallback((title, description, icon) => {
    const achievement = { title, description, icon, unlockedAt: new Date() };
    setAchievements(prev => {
      if (prev.find(a => a.title === title)) return prev;
      return [...prev, achievement];
    });
    setShowAchievement(achievement);
    speak(`Achievement unlocked: ${title}! ${description}`, "celebrating");
    createParticles(200, 200, 'emoji');

    setTimeout(() => setShowAchievement(null), 5000);
  }, [speak, createParticles]);

  // Start listening - DEFINED EARLY (before handleWakeWordDetected uses it)
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      speak("Sorry, voice recognition is not supported in your browser. But you can still click my buttons!", "thinking");
      return;
    }

    try {
      stopSpeech();
      recognitionRef.current.start();
    } catch (e) {
      addLog("error", "Failed to start listening");
    }
  }, [addLog, speak, stopSpeech]);

  // NEW: Wake word detection function
  const detectWakeWord = useCallback((transcript) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    const wakeWords = [
      'hey dhyan', 'hi dhyan', 'hello dhyan', 'okay dhyan', 'yo dhyan',
      'dhyan', 'dylan', 'dian', 'dhayan', 'dayan'
    ];

    return wakeWords.some(word => lowerTranscript.includes(word));
  }, []);

  // OPTIMIZED: Handle wake word detected - FASTER (500ms instead of 2500ms)
  const handleWakeWordDetected = useCallback(() => {
    setWakeWordDetected(true);
    setShowWakeWordIndicator(true);
    setIsListeningForWakeWord(false);

    // Stop wake word listening
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
    }

    // Visual feedback
    setEmotion("excited");

    // Speak greeting
    speak(`Yes ${userName || 'friend'}! I'm here!`, "excited");

    // Start regular listening MUCH FASTER (500ms instead of 2500ms)
    setTimeout(() => {
      startListening();
    }, 500);

    // Hide indicator faster (3000ms instead of 5000ms)
    wakeWordTimeoutRef.current = setTimeout(() => {
      setShowWakeWordIndicator(false);
      setWakeWordDetected(false);
    }, 3000);
  }, [speak, startListening, userName]);

  // NEW: Start wake word listening
  const startWakeWordListening = useCallback(() => {
    if (!wakeWordRecognitionRef.current || !wakeWordEnabled) return;

    try {
      wakeWordRecognitionRef.current.start();
      setIsListeningForWakeWord(true);
      addLog("info", "Wake word listening started...");
    } catch (e) {
      // Already started or other error
    }
  }, [addLog, wakeWordEnabled]);

  // NEW: Stop wake word listening
  const stopWakeWordListening = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListeningForWakeWord(false);
  }, []);

  // NEW: Toggle wake word - FIXED: Added visual feedback
  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        const msg = "🎧 Wake word enabled! Say 'Hey Dhyan' anytime to call me!";
        setCurrentMessage(msg);
        speak(msg, "happy");
        startWakeWordListening();
      } else {
        const msg = "🔇 Wake word disabled. Click the microphone when you need me!";
        setCurrentMessage(msg);
        speak(msg, "thinking");
        stopWakeWordListening();
      }
      return newValue;
    });
  }, [speak, startWakeWordListening, stopWakeWordListening, setCurrentMessage]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setEmotion("thinking");
        addLog("info", "Listening for voice command...");
      };
      
      recognitionRef.current.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        addLog("info", `Heard: "${command}"`);
        processCommand(command);
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setEmotion("happy");
        addLog("error", `Listening error: ${event.error}`);
        if (event.error === 'not-allowed') {
          speak("Please allow microphone access so I can hear your commands!", "thinking");
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setEmotion("happy");
        // Restart wake word listening if enabled
        if (wakeWordEnabled && !isSpeaking) {
          setTimeout(() => {
            startWakeWordListening();
          }, 500);
        }
      };

      // NEW: Initialize wake word recognition (separate instance for continuous listening)
      wakeWordRecognitionRef.current = new SpeechRecognition();
      wakeWordRecognitionRef.current.continuous = true;
      wakeWordRecognitionRef.current.interimResults = true;
      wakeWordRecognitionRef.current.lang = 'en-US';

      wakeWordRecognitionRef.current.onstart = () => {
        setIsListeningForWakeWord(true);
        addLog("info", "🔊 Wake word listening active...");
      };

      wakeWordRecognitionRef.current.onresult = (event) => {
        const results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript;
          const isFinal = results[i].isFinal;

          if (detectWakeWord(transcript)) {
            if (isFinal || transcript.length > 10) {
              addLog("success", `🎯 Wake word detected: "${transcript}"`);
              handleWakeWordDetected();
              break;
            }
          }
        }
      };

      // FIX: Add retry counter to prevent infinite loops
      const wakeWordRetryCount = { current: 0 };
      const MAX_WAKE_WORD_RETRIES = 3;

      wakeWordRecognitionRef.current.onerror = (event) => {
        // Don't log expected errors
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          addLog("error", `Wake word error: ${event.error}`);
        }

        // FIX: Don't restart on network errors (requires internet) or after max retries
        if (event.error === 'network') {
          addLog("error", "Network error - speech recognition requires internet");
          wakeWordRetryCount.current = 0; // Reset counter
          return; // Don't restart
        }

        if (event.error === 'not-allowed') {
          addLog("error", "Microphone permission denied - please allow microphone access");
          return; // Don't restart
        }

        // Only restart if we haven't exceeded max retries
        if (wakeWordEnabled && wakeWordRetryCount.current < MAX_WAKE_WORD_RETRIES) {
          wakeWordRetryCount.current++;
          addLog("info", `Restarting wake word (attempt ${wakeWordRetryCount.current}/${MAX_WAKE_WORD_RETRIES})...`);
          setTimeout(() => {
            startWakeWordListening();
          }, 2000); // FIX: Increased delay to 2s
        } else if (wakeWordRetryCount.current >= MAX_WAKE_WORD_RETRIES) {
          addLog("error", "Max wake word retries reached - speech recognition disabled");
          setWakeWordEnabled(false);
          wakeWordRetryCount.current = 0;
        }
      };

      wakeWordRecognitionRef.current.onend = () => {
        setIsListeningForWakeWord(false);
        // FIX: Only auto-restart if enabled AND we haven't hit max retries
        if (wakeWordEnabled && !isListening && !wakeWordDetected && wakeWordRetryCount.current < MAX_WAKE_WORD_RETRIES) {
          setTimeout(() => {
            startWakeWordListening();
          }, 1500); // FIX: Increased delay to 1.5s
        }
      };

      // Start wake word listening initially
      if (wakeWordEnabled) {
        setTimeout(() => {
          startWakeWordListening();
        }, 2000);
      }
    }

    return () => {
      stopSpeech();
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    };
  }, [addLog, stopSpeech, detectWakeWord, handleWakeWordDetected, startWakeWordListening, wakeWordEnabled, isSpeaking, isListening, wakeWordDetected]);

  // OPTIMIZED: Pre-computed game data for faster access
  const gameDataRef = useRef(CONTENT_LIBRARY.games);

  // OPTIMIZED: Faster game question loading - DEFINED BEFORE startGame
  const nextQuestion = useCallback((gameType) => {
    const games = gameDataRef.current;
    let question = null;
    let questionText = "";

    switch(gameType) {
      case 'riddle':
        question = games.riddles[Math.floor(Math.random() * games.riddles.length)];
        questionText = `Riddle: ${question.question}`;
        break;
      case 'trivia':
        question = games.trivia[Math.floor(Math.random() * games.trivia.length)];
        questionText = `Trivia: ${question.question}`;
        break;
      case 'math':
        const difficulty = gameState.difficulty || 'easy';
        question = games.math[difficulty][Math.floor(Math.random() * games.math[difficulty].length)];
        questionText = `Math: ${question.question}`;
        break;
      case 'spelling':
        question = games.spelling[Math.floor(Math.random() * games.spelling.length)];
        questionText = `Spell: ${question.word}. Hint: ${question.hint}`;
        break;
      case 'wordScramble':
        question = games.wordScramble[Math.floor(Math.random() * games.wordScramble.length)];
        questionText = `Unscramble: ${question.scrambled}`;
        break;
      case 'animalSounds':
        question = games.animalSounds[Math.floor(Math.random() * games.animalSounds.length)];
        questionText = `What animal says ${question.sound}?`;
        break;
      case 'colors':
        question = games.colors[Math.floor(Math.random() * games.colors.length)];
        questionText = `What color is this? Hint: ${question.hint}`;
        break;
      case 'shapes':
        question = games.shapes[Math.floor(Math.random() * games.shapes.length)];
        questionText = `What shape is this? Hint: ${question.hint}`;
        break;
      case 'patterns':
        question = games.patterns[Math.floor(Math.random() * games.patterns.length)];
        questionText = `What comes next in this pattern: ${question.sequence.join(' ')} ?`;
        break;
      case 'memory':
        const memoryItems = games.memory.slice(0, 4);
        question = {
          items: memoryItems,
          target: memoryItems[Math.floor(Math.random() * memoryItems.length)]
        };
        questionText = `I will show you some pictures. Remember them! Look at the ${memoryItems.map(i => i.name).join(', ')}. Now, what was the ${question.target.category}?`;
        break;
    }

    setGameState(prev => ({ ...prev, currentQuestion: question, waitingForAnswer: true }));
    speak(questionText, "excited");
  }, [gameState.difficulty, speak]);

  // OPTIMIZED: Game Functions with faster startup - DEFINED AFTER nextQuestion
  const startGame = useCallback((gameType) => {
    const initialPowerUps = {
      timeFreeze: 2,
      doublePoints: 2,
      hint: 3,
      skip: 1,
      extraLife: 1
    };
    
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      type: gameType, 
      score: 0, 
      streak: 0, 
      questionsAnswered: 0,
      wrongAttempts: 0,
      hintsUsed: 0,
      powerUps: initialPowerUps,
      activePowerUp: null,
      startTime: Date.now()
    }));
    setCurrentMode("game");
    addLog("info", `Game: ${gameType}`);

    // FASTER: 300ms instead of 1000ms
    setTimeout(() => {
      nextQuestion(gameType);
    }, 300);
  }, [addLog, nextQuestion]);

  // NEW: Timer Functions
  const startTimer = useCallback((seconds) => {
    setGameState(prev => ({
      ...prev,
      timeRemaining: seconds,
      totalTime: seconds,
      timerActive: true
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setGameState(prev => ({ ...prev, timerActive: false }));
  }, []);

  const usePowerUp = useCallback((powerUpType) => {
    if (gameState.powerUps[powerUpType] > 0) {
      setGameState(prev => ({
        ...prev,
        powerUps: { ...prev.powerUps, [powerUpType]: prev.powerUps[powerUpType] - 1 },
        activePowerUp: powerUpType
      }));
      
      // Apply power-up effects
      switch(powerUpType) {
        case 'timeFreeze':
          stopTimer();
          speak("Time frozen! You have 10 extra seconds! ⏱️", "excited");
          setTimeout(() => {
            setGameState(prev => ({ ...prev, timerActive: true }));
          }, 10000);
          break;
        case 'doublePoints':
          speak("Double points activated! Next answer worth 20 points! 2️⃣", "excited");
          break;
        case 'hint':
          const hint = gameState.currentQuestion?.hint || "Think carefully!";
          speak(`Hint: ${hint} 💡`, "thinking");
          setGameState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
          break;
        case 'skip':
          speak("Question skipped! Moving to next one! ⏭️", "happy");
          nextQuestion(gameState.type);
          break;
        case 'extraLife':
          speak("Extra life ready! You can make one mistake! ❤️", "happy");
          break;
      }
    }
  }, [gameState.powerUps, gameState.currentQuestion, gameState.type, nextQuestion, speak, stopTimer]);

  // ENHANCED: Get contextual praise for the game type
  const getContextualPraise = useCallback((gameType, streak) => {
    const metadata = CONTENT_LIBRARY.games.gameMetadata?.[gameType];
    if (metadata && metadata.praiseMessages) {
      const index = (streak - 1) % metadata.praiseMessages.length;
      return metadata.praiseMessages[index];
    }
    return "Correct! Well done!";
  }, []);

  // ENHANCED: Get educational fact for memory game items
  const getMemoryFact = useCallback((item) => {
    if (item.fact) {
      return ` Did you know? ${item.fact}`;
    }
    return "";
  }, []);

  const checkAnswer = useCallback((userAnswer) => {
    if (!gameState.currentQuestion || !gameState.waitingForAnswer) return;
    
    const correct = gameState.currentQuestion.answer.toLowerCase().trim();
    const user = userAnswer.toLowerCase().trim();
    const isCorrect = user.includes(correct) || correct.includes(user);
    
    if (isCorrect) {
      const newStreak = gameState.streak + 1;
      // ENHANCED: Double points power-up
      const basePoints = 10 + (newStreak >= 3 ? 5 : 0);
      const doubleMultiplier = gameState.activePowerUp === 'doublePoints' ? 2 : 1;
      const newScore = gameState.score + (basePoints * doubleMultiplier);
      const bonus = newStreak >= 3 ? ` ${newStreak} in a row! Keep it up!` : "";

      // ENHANCED: Particle effects for correct answer
      createParticles(150 + Math.random() * 100, 100, 'emoji');
      addFloatingEmoji('🎯', 'excited');

      // ENHANCED: Achievement unlocks
      if (newStreak === 3) unlockAchievement("On Fire!", "Answered 3 questions correctly in a row!", "🔥");
      if (newStreak === 5) {
        unlockAchievement("Unstoppable!", "Answered 5 questions correctly in a row!", "⚡");
        triggerCelebration(); // BIG CELEBRATION!
      }
      if (newScore >= 50) {
        unlockAchievement("High Scorer!", "Scored 50 points in one game!", "🏆");
        triggerCelebration(); // BIG CELEBRATION!
      }

      // ENHANCED: Contextual praise based on game type
      const praise = getContextualPraise(gameState.type, newStreak);
      let fact = "";
      
      // Add educational fact for memory game
      if (gameState.type === 'memory' && gameState.currentQuestion.target?.fact) {
        fact = getMemoryFact(gameState.currentQuestion.target);
      }

      const doubleMsg = doubleMultiplier > 1 ? " Double points! 🎉" : "";
      speak(`${praise}${bonus}${doubleMsg}${fact}`, "celebrating");
      setGameState(prev => ({
        ...prev,
        score: newScore,
        streak: newStreak,
        questionsAnswered: prev.questionsAnswered + 1,
        waitingForAnswer: false,
        activePowerUp: null // Reset power-up after use
      }));
      setTotalScore(prev => prev + newScore);
      setSessionStreak(prev => prev + 1);
    } else {
      // ENHANCED: Extra Life power-up
      if (gameState.activePowerUp === 'extraLife' || gameState.powerUps.extraLife > 0) {
        speak("Oops! But your extra life saved you! Try again! ❤️", "thinking");
        setGameState(prev => ({
          ...prev,
          powerUps: { ...prev.powerUps, extraLife: prev.powerUps.extraLife - 1 },
          wrongAttempts: prev.wrongAttempts + 1,
          activePowerUp: null
        }));
        return; // Don't end turn, let them try again
      }
      
      addFloatingEmoji('💭', 'thinking');
      speak(`Not quite! The answer was: ${gameState.currentQuestion.answer}. Let's try another one!`, "thinking");
      setGameState(prev => ({ 
        ...prev, 
        streak: 0, 
        questionsAnswered: prev.questionsAnswered + 1, 
        wrongAttempts: prev.wrongAttempts + 1,
        waitingForAnswer: false 
      }));
      setSessionStreak(0);
    }
    
    // OPTIMIZED: Faster game flow (1500ms instead of 3000ms)
    setTimeout(() => {
      if (gameState.questionsAnswered < 4) {
        nextQuestion(gameState.type);
      } else {
        endGame();
      }
    }, 1500);
  }, [gameState, speak, nextQuestion, unlockAchievement, createParticles, addFloatingEmoji, triggerCelebration]);
  
  const endGame = useCallback(() => {
    const finalScore = gameState.score;
    const message = finalScore >= 40 ? `Amazing! You scored ${finalScore} points! You're a genius!` :
                   finalScore >= 20 ? `Great job! You scored ${finalScore} points!` :
                   `You scored ${finalScore} points. Keep practicing!`;
    speak(message, "celebrating");

    // NEW: Update daily challenges
    setDailyChallenges(prev => prev.map(challenge => {
      if (challenge.id === 2) { // Score challenge
        const newCurrent = challenge.current + finalScore;
        if (newCurrent >= challenge.target && !challenge.completed) {
          unlockAchievement(challenge.reward, `Completed: ${challenge.title}`, "🏅");
          return { ...challenge, current: newCurrent, completed: true };
        }
        return { ...challenge, current: newCurrent };
      }
      return challenge;
    }));

    // NEW: Update learning progress
    setLearningProgress(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      correctAnswers: prev.correctAnswers + Math.floor(finalScore / 10)
    }));

    setGameState({ isPlaying: false, type: null, currentQuestion: null, score: 0, streak: 0, questionsAnswered: 0, waitingForAnswer: false, difficulty: 'easy' });
    setCurrentMode("chat");
  }, [gameState.score, unlockAchievement, speak]);

  // FIX: Add refs for breathing exercise cleanup
  const breathingIntervalRef = useRef(null);
  const breathingTimeoutRef = useRef(null);

  // NEW: Breathing Exercise - FIXED: Added visual feedback
  const startBreathingExercise = useCallback(() => {
    // Clear any existing breathing timers
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    if (breathingTimeoutRef.current) clearTimeout(breathingTimeoutRef.current);

    setBreathingActive(true);
    setBreathingPhase("inhale");
    const startMsg = "🧘 Let's take a deep breath together. Breathe in slowly... hold... and breathe out. Feel your body relax.";
    setCurrentMessage(startMsg);
    speak(startMsg, "calm");

    const cycle = ["inhale", "hold", "exhale", "hold"];
    const phaseEmojis = { "inhale": "🌬️", "hold": "⏸️", "exhale": "💨" };
    let step = 0;

    breathingIntervalRef.current = setInterval(() => {
      step = (step + 1) % 4;
      const phase = cycle[step];
      setBreathingPhase(phase);

      let msg;
      if (step === 0) msg = `${phaseEmojis.inhale} Breathe in...`;
      else if (step === 1) msg = `${phaseEmojis.hold} Hold...`;
      else if (step === 2) msg = `${phaseEmojis.exhale} Breathe out...`;
      else msg = `${phaseEmojis.hold} Hold...`;
      
      setCurrentMessage(msg);
      if (step !== 3) speak(msg, "calm");
    }, 4000);

    // Stop after 2 minutes
    breathingTimeoutRef.current = setTimeout(() => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
        breathingIntervalRef.current = null;
      }
      setBreathingActive(false);
      const endMsg = "✨ Great job! You did a wonderful job relaxing. Feel free to come back anytime you need to calm down.";
      setCurrentMessage(endMsg);
      speak(endMsg, "happy");
      unlockAchievement("Zen Master", "Completed a breathing exercise!", "🧘");
    }, 120000);
  }, [speak, unlockAchievement, setCurrentMessage]);

  // FIX: Cleanup breathing timers on unmount
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
      if (breathingTimeoutRef.current) {
        clearTimeout(breathingTimeoutRef.current);
      }
    };
  }, []);

  // NEW: AI Difficulty Adjustment
  const adjustDifficulty = useCallback((gameType, performance) => {
    if (!adaptiveDifficulty) return;

    setUserSkillLevel(prev => {
      const subject = gameType === 'math' ? 'math' :
                     gameType === 'riddle' || gameType === 'trivia' ? 'logic' :
                     gameType === 'memory' ? 'memory' : 'overall';

      const currentLevel = prev[subject];
      let newLevel = currentLevel;

      if (performance > 0.8 && currentLevel < 5) newLevel = currentLevel + 1;
      else if (performance < 0.4 && currentLevel > 1) newLevel = currentLevel - 1;

      return { ...prev, [subject]: newLevel };
    });
  }, [adaptiveDifficulty]);

  // NEW: Claim Daily Reward
  const claimDailyReward = useCallback(() => {
    if (dailyRewardClaimed) {
      speak("You've already claimed your daily reward! Come back tomorrow!", "thinking");
      return;
    }

    const reward = Math.floor(Math.random() * 50) + 10;
    setTotalScore(prev => prev + reward);
    setDailyRewardClaimed(true);
    createParticles(200, 200, 'emoji');
    speak(`Daily reward claimed! You got ${reward} bonus points! Great job keeping your streak!`, "celebrating");
    unlockAchievement("Daily Player", "Claimed daily reward!", "📅");
  }, [dailyRewardClaimed, speak, unlockAchievement, createParticles]);

  // NEW: Update Streak
  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    const lastActive = streakData.lastActiveDate;

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = streakData.currentStreak;
    if (lastActive === yesterday.toDateString()) {
      newStreak += 1;
    } else if (lastActive !== today) {
      newStreak = 1;
    }

    setStreakData(prev => ({
      ...prev,
      currentStreak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
      lastActiveDate: today
    }));

    if (newStreak === 7) unlockAchievement("Week Warrior", "7 day streak!", "🔥");
    if (newStreak === 30) unlockAchievement("Monthly Master", "30 day streak!", "👑");
  }, [streakData.lastActiveDate, unlockAchievement]);

  // NEW: Change Avatar - FIXED: Added visual feedback
  const changeAvatar = useCallback((avatar) => {
    setSelectedAvatar(avatar);
    const msg = `🎉 Your new friend ${avatar} is ready to play!`;
    setCurrentMessage(msg);
    speak(msg, "happy");
    createParticles(150, 150, 'emoji');
  }, [speak, createParticles, setCurrentMessage]);

  // NEW: Change Theme
  const changeTheme = useCallback((theme) => {
    setSelectedTheme(theme.name);
    speak(`Theme changed to ${theme.name}! Looking beautiful!`, "happy");
  }, [speak]);

  // NEW: Story Creator Functions
  const startStoryCreator = useCallback(() => {
    setStoryCreatorActive(true);
    setCreatedStory({ character: null, setting: null, problem: null, resolution: null, fullStory: null });
    speak("Let's create a magical story together! First, pick a character. Say: brave knight, clever fox, or kind princess!", "excited");
  }, [speak]);

  const processStoryStep = useCallback((input) => {
    const lower = input.toLowerCase();

    if (!createdStory.character) {
      let character = null;
      if (lower.includes('knight')) character = { name: 'Brave Knight', emoji: '🛡️', trait: 'brave' };
      else if (lower.includes('fox')) character = { name: 'Clever Fox', emoji: '🦊', trait: 'clever' };
      else if (lower.includes('princess')) character = { name: 'Kind Princess', emoji: '👸', trait: 'kind' };
      else if (lower.includes('dragon')) character = { name: 'Friendly Dragon', emoji: '🐉', trait: 'friendly' };
      else if (lower.includes('robot')) character = { name: 'Smart Robot', emoji: '🤖', trait: 'smart' };

      if (character) {
        setCreatedStory(prev => ({ ...prev, character }));
        speak(`Great choice! ${character.name} it is! Now, where does the story happen? Say: enchanted forest, space station, or underwater kingdom!`, "excited");
      } else {
        speak("I didn't catch that. Please say: brave knight, clever fox, kind princess, friendly dragon, or smart robot!", "thinking");
      }
      return;
    }

    if (!createdStory.setting) {
      let setting = null;
      if (lower.includes('forest')) setting = { name: 'Enchanted Forest', description: 'magical woods with talking trees' };
      else if (lower.includes('space')) setting = { name: 'Space Station', description: 'floating among the stars' };
      else if (lower.includes('underwater')) setting = { name: 'Underwater Kingdom', description: 'deep beneath the ocean waves' };
      else if (lower.includes('castle')) setting = { name: 'Crystal Castle', description: 'sparkling towers in the clouds' };
      else if (lower.includes('jungle')) setting = { name: 'Mystic Jungle', description: 'lush green wilderness full of secrets' };

      if (setting) {
        setCreatedStory(prev => ({ ...prev, setting }));
        speak(`What an amazing place! Now, what problem does ${createdStory.character.name} face? Say: lost treasure, evil villain, or big storm!`, "thinking");
      } else {
        speak("I didn't understand. Please say: enchanted forest, space station, underwater kingdom, crystal castle, or mystic jungle!", "thinking");
      }
      return;
    }

    if (!createdStory.problem) {
      let problem = null;
      if (lower.includes('treasure') || lower.includes('lost')) problem = { name: 'Lost Treasure', description: 'must find the hidden treasure' };
      else if (lower.includes('villain') || lower.includes('evil')) problem = { name: 'Evil Villain', description: 'must stop the wicked villain' };
      else if (lower.includes('storm')) problem = { name: 'Big Storm', description: 'must survive the terrible storm' };
      else if (lower.includes('puzzle') || lower.includes('riddle')) problem = { name: 'Ancient Puzzle', description: 'must solve the mystery' };
      else if (lower.includes('monster')) problem = { name: 'Sleepy Monster', description: 'must help the grumpy monster' };

      if (problem) {
        setCreatedStory(prev => ({ ...prev, problem }));
        speak(`Oh no! ${problem.name}! How does ${createdStory.character.name} solve it? Say: uses magic, makes friends, or never gives up!`, "excited");
      } else {
        speak("Please tell me the problem! Say: lost treasure, evil villain, big storm, ancient puzzle, or sleepy monster!", "thinking");
      }
      return;
    }

    if (!createdStory.resolution) {
      let resolution = null;
      if (lower.includes('magic')) resolution = { name: 'Uses Magic', description: 'uses special powers to save the day' };
      else if (lower.includes('friends') || lower.includes('help')) resolution = { name: 'Makes Friends', description: 'friends come together to help' };
      else if (lower.includes('never') || lower.includes('gives up')) resolution = { name: 'Never Gives Up', description: 'keeps trying until they succeed' };
      else if (lower.includes('smart') || lower.includes('clever')) resolution = { name: 'Clever Idea', description: 'thinks of a brilliant solution' };
      else if (lower.includes('kind') || lower.includes('love')) resolution = { name: 'Kindness Wins', description: 'shows kindness and saves the day' };

      if (resolution) {
        const fullStory = `Once upon a time, there was ${createdStory.character.name} who was very ${createdStory.character.trait}. 
          One day, in the ${createdStory.setting.name} where ${createdStory.setting.description}, 
          they faced a big challenge: ${createdStory.problem.description}. 
          But ${createdStory.character.name} didn't give up! In the end, they ${resolution.description}.
          And they all lived happily ever after! The End.`;

        setCreatedStory(prev => ({ ...prev, resolution, fullStory }));
        speak(fullStory, "story");
        unlockAchievement("Storyteller", "Created your own magical story!", "📚");
        createParticles(200, 200, 'emoji');
      } else {
        speak("How was the problem solved? Say: uses magic, makes friends, never gives up, clever idea, or kindness wins!", "thinking");
      }
    }
  }, [createdStory, speak, unlockAchievement, createParticles]);

  // NEW: Reward Shop Functions
  const toggleRewardShop = useCallback(() => {
    setRewardShopOpen(prev => !prev);
    if (!rewardShopOpen) {
      speak("Welcome to the Reward Shop! Spend your points on cool items!", "excited");
    }
  }, [rewardShopOpen, speak]);

  const purchaseItem = useCallback((item) => {
    if (purchasedItems.includes(item.id)) {
      speak(`You already own the ${item.name}!`, "thinking");
      return;
    }

    if (totalScore < item.cost) {
      speak(`You need ${item.cost - totalScore} more points to buy the ${item.name}! Keep playing games!`, "thinking");
      return;
    }

    setTotalScore(prev => prev - item.cost);
    setPurchasedItems(prev => [...prev, item.id]);
    speak(`Congratulations! You bought the ${item.name}!`, "celebrating");
    createParticles(200, 200, 'emoji');
  }, [totalScore, purchasedItems, speak, createParticles]);

  const equipItem = useCallback((item) => {
    setEquippedItems(prev => ({ ...prev, [item.type]: item.id }));
    speak(`You equipped the ${item.name}! Looking great!`, "happy");
  }, [speak]);

  // NEW: Sound Effects Functions
  const playSoundEffect = useCallback((type) => {
    if (!soundEnabled) return;

    try {
      // Create simple beep sounds using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'correct') {
        // Happy ascending sound
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'wrong') {
        // Low descending sound
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'achievement') {
        // Victory fanfare
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6
        gainNode.gain.setValueAtTime(soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'click') {
        // Short click
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(soundVolume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [soundEnabled, soundVolume]);

  // NEW: Detect Season
  const detectSeason = useCallback(() => {
    const month = new Date().getMonth();
    let season = 'spring';
    if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else if (month >= 11 || month <= 1) season = 'winter';
    setCurrentSeason(season);
  }, []);

  // NEW: Simple Emotion Detection from Voice
  const detectEmotionFromVoice = useCallback((transcript) => {
    const lower = transcript.toLowerCase();
    let emotion = 'neutral';

    if (lower.match(/yay|awesome|great|happy|love|fun|excited/)) emotion = 'happy';
    else if (lower.match(/sad|upset|cry|hurt|sorry/)) emotion = 'sad';
    else if (lower.match(/mad|angry|hate|frustrated|annoyed/)) emotion = 'angry';
    else if (lower.match(/scared|afraid|frightened|nervous/)) emotion = 'fear';
    else if (lower.match(/wow|amazing|cool|whoa/)) emotion = 'surprised';

    setDetectedEmotion(emotion);
    setEmotionHistory(prev => [...prev.slice(-9), { emotion, timestamp: Date.now() }]);

    // Respond to emotions
    if (emotion === 'sad') {
      speak("I can tell you might be feeling a bit down. Would you like to try a calming breathing exercise?", "calm");
    } else if (emotion === 'angry') {
      speak("It sounds like you're frustrated. Let's take a deep breath together and play something fun!", "calm");
    } else if (emotion === 'happy') {
      speak("I love hearing how happy you are! Let's keep having fun!", "excited");
    }
  }, [speak]);

  // Process voice/text commands
  const processCommand = useCallback((command) => {
    addLog("info", `Processing command: ${command}`);
    
    // If in game and waiting for answer, check if it's an answer
    if (gameState.isPlaying && gameState.waitingForAnswer) {
      checkAnswer(command);
      return;
    }
    
    // Stop command
    if (command.includes("stop") || command.includes("quiet") || command.includes("shush") || command.includes("end game")) {
      if (gameState.isPlaying) {
        endGame();
        return;
      }
      stopSpeech();
      speak("Okay, I'll stop speaking now.", "happy");
      setCurrentMode("chat");
      return;
    }
    
    // Greeting commands
    if (command.includes("hello") || command.includes("hi") || command.includes("hey")) {
      speak(`Hello ${userName || "friend"}! I'm Dhyan, your interactive learning companion. I can tell stories, sing songs, play games, and even read books to you!`, "happy");
      return;
    }
    
    // Help command
    if (command.includes("help") || command.includes("what can you do")) {
      speak("I can do many things! Say 'sing a song' to hear a song, 'tell me a story' for stories, 'read a poem' for poems, 'read a book' for book excerpts, 'play a game' for fun games, 'math quiz' for math practice, or 'tell me my stats' to hear your progress!", "thinking");
      return;
    }
    
    // Game commands
    if (command.includes("play a game") || command.includes("lets play") || command.includes("game time")) {
      speak("Let's play! I can play riddles, trivia, word scramble, or animal sounds. Which game would you like? Say 'riddles', 'trivia', 'word scramble', or 'animal sounds'!", "excited");
      return;
    }
    
    if (command.includes("riddle")) {
      speak("Great choice! Let's solve some riddles! I'll ask you 5 riddles. Here we go!", "excited");
      startGame('riddle');
      return;
    }
    
    if (command.includes("trivia")) {
      speak("Trivia time! Let's test your knowledge with 5 fun questions!", "excited");
      startGame('trivia');
      return;
    }
    
    if (command.includes("math") || command.includes("numbers")) {
      speak("Math practice! I'll give you addition, subtraction, multiplication, and division problems. Let's go!", "excited");
      setGameState(prev => ({ ...prev, difficulty: command.includes('hard') ? 'hard' : command.includes('medium') ? 'medium' : 'easy' }));
      startGame('math');
      return;
    }
    
    if (command.includes("spelling")) {
      speak("Spelling bee! I'll say a word, you spell it out loud. Let's begin!", "excited");
      startGame('spelling');
      return;
    }
    
    if (command.includes("word scramble") || command.includes("scramble")) {
      speak("Word scramble! I'll give you mixed up letters. Unscramble them to find the word!", "excited");
      startGame('wordScramble');
      return;
    }
    
    if (command.includes("animal sounds") || command.includes("animal game")) {
      speak("Animal sounds game! I'll make an animal sound, you tell me which animal it is!", "excited");
      startGame('animalSounds');
      return;
    }

    // NEW: Story Creator command
    if (command.includes("create story") || command.includes("make story") || command.includes("story creator")) {
      startStoryCreator();
      return;
    }

    // NEW: Process story creator inputs
    if (storyCreatorActive && !createdStory.fullStory) {
      processStoryStep(command);
      return;
    }
    
    // Song commands
    if (command.includes("song") || command.includes("sing") || command.includes("music")) {
      const song = CONTENT_LIBRARY.songs[Math.floor(Math.random() * CONTENT_LIBRARY.songs.length)];
      setCurrentMode("song");
      setCurrentContent(song);
      speak(`Here's a song called "${song.title}"!`, "excited", () => {
        setTimeout(() => {
          speak(song.lyrics, "excited");
        }, 500);
      });
      return;
    }
    
    // Poem commands
    if (command.includes("poem") || command.includes("poetry") || command.includes("verse")) {
      const poem = CONTENT_LIBRARY.poems[Math.floor(Math.random() * CONTENT_LIBRARY.poems.length)];
      setCurrentMode("poem");
      setCurrentContent(poem);
      speak(`Here's a beautiful poem by ${poem.author} called "${poem.title}".`, "thinking", () => {
        setTimeout(() => {
          speak(poem.text, "thinking");
        }, 500);
      });
      return;
    }
    
    // Story commands
    if (command.includes("story") || command.includes("tale") || command.includes("adventure")) {
      const story = CONTENT_LIBRARY.stories[Math.floor(Math.random() * CONTENT_LIBRARY.stories.length)];
      setCurrentMode("story");
      setCurrentContent(story);
      speak(`Here's a story called "${story.title}".`, "story", () => {
        setTimeout(() => {
          speak(story.content, "story");
        }, 500);
      });
      return;
    }
    
    // Book/Novel commands
    if (command.includes("book") || command.includes("novel") || command.includes("read") || command.includes("chapter")) {
      const book = CONTENT_LIBRARY.books[Math.floor(Math.random() * CONTENT_LIBRARY.books.length)];
      setCurrentMode("book");
      setCurrentContent(book);
      speak(`Let me read you an excerpt from "${book.title}" by ${book.author}.`, "thinking", () => {
        setTimeout(() => {
          speak(book.excerpt, "story");
        }, 500);
      });
      return;
    }
    
    // Stats commands
    if (command.includes("stats") || command.includes("progress") || command.includes("how am i doing")) {
      if (!stats) {
        speak("I don't have your stats yet. Try playing some games first!", "thinking");
        return;
      }
      const message = `Here's your progress: You have ${stats.total_children || 0} children registered. You've played ${stats.total_sessions || 0} games and completed ${stats.completed_sessions || 0} sessions. ${stats.total_sessions >= 5 ? "You're doing amazing! Keep it up!" : "Keep playing to improve your skills!"}`;
      speak(message, "thinking");
      return;
    }
    
    // Encouragement
    if (command.includes("encourage") || command.includes("motivate") || command.includes("i'm sad")) {
      const encouragements = [
        "You are capable of amazing things! Every expert was once a beginner. Keep going!",
        "Believe in yourself! You have unique talents that nobody else has. Shine bright!",
        "Mistakes help us learn and grow. Don't give up - you're getting better every day!",
        "You are braver than you believe, stronger than you seem, and smarter than you think!",
        "The only way to do great work is to love what you do. You're doing great!"
      ];
      speak(encouragements[Math.floor(Math.random() * encouragements.length)], "celebrating");
      return;
    }
    
    // Joke command
    if (command.includes("joke") || command.includes("funny") || command.includes("laugh")) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a fake noodle? An impasta!"
      ];
      speak(jokes[Math.floor(Math.random() * jokes.length)], "excited");
      return;
    }
    
    // Weather/time (placeholder responses)
    if (command.includes("weather") || command.includes("time")) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      speak(`It's currently ${timeString}. Have a wonderful day!`, "happy");
      return;
    }
    
    // Default response
    speak(`I heard you say: "${command}". Try saying "help" to learn what I can do!`, "thinking");
  }, [addLog, speak, stopSpeech, stats, userName, gameState.isPlaying, gameState.waitingForAnswer, checkAnswer, endGame, startGame, setGameState]);

  // NEW: Detect season on mount
  useEffect(() => {
    detectSeason();
  }, [detectSeason]);

  // Welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const greetings = [
        `Hi ${userName || "there"}! I'm Dhyan, your interactive learning buddy! Click the microphone or say "help" to learn what I can do!`,
        `Hello ${userName || "friend"}! I'm Dhyan! I can sing songs, tell stories, read poems, and books! Try saying "sing a song"!`,
        `Hey ${userName || "there"}! Welcome back! I'm Dhyan, ready to help you learn! Say "tell me a story" to hear something fun!`
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      speak(greeting, "happy");
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [userName, speak]);
  
  // Emojis for different emotions
  const avatars = {
    happy: "😊",
    excited: "🤩",
    thinking: "🤔",
    celebrating: "🥳",
    waving: "👋",
    story: "📚",
    song: "🎵",
    game: "🎮"
  };
  
  // Colors for different emotions - Cute Pastel Rainbow Theme
  const emotionColors = {
    happy: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
    excited: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    thinking: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    celebrating: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
    waving: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    story: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    song: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    game: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
  };
  
  // Get current avatar based on mode
  const getCurrentAvatar = () => {
    if (currentMode === "song") return avatars.song;
    if (currentMode === "story" || currentMode === "book") return avatars.story;
    if (currentMode === "game") return avatars.game;
    return avatars[emotion] || avatars.happy;
  };
  
  // Get current color based on mode
  const getCurrentColor = () => {
    if (currentMode === "song") return emotionColors.song;
    if (currentMode === "story" || currentMode === "book") return emotionColors.story;
    if (currentMode === "game") return emotionColors.game;
    return emotionColors[emotion] || emotionColors.happy;
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: emotionColors.happy,
          border: "none",
          fontSize: 28,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
          zIndex: 100,
          animation: "bounce-soft 2s ease-in-out infinite"
        }}
      >
        {avatars.happy}
      </button>
    );
  }
  
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 12
    }}>
      {/* Ambient Background Particles */}
      <AmbientParticles />

      {/* Confetti Explosion for Big Achievements */}
      <ConfettiExplosion trigger={confettiTrigger} />

      {/* Background Music Player */}
      {musicPlayerOpen && (
        <MusicPlayer
          isOpen={musicPlayerOpen}
          onClose={() => setMusicPlayerOpen(false)}
        />
      )}

      {/* Music Player Toggle Button */}
      {!musicPlayerOpen && (
        <MusicPlayerButton onClick={() => setMusicPlayerOpen(true)} />
      )}

      {/* Main Control Panel */}
      {(currentMessage || isExpanded) && (
        <div style={{
          background: "linear-gradient(135deg, #fff5f7 0%, #ffeef8 50%, #f0f9ff 100%)",
          borderRadius: 28,
          padding: "22px",
          maxWidth: 340,
          boxShadow: "0 12px 40px rgba(255, 154, 158, 0.25), 0 4px 12px rgba(161, 140, 209, 0.15)",
          border: "4px solid rgba(255, 154, 158, 0.4)",
          position: "relative",
          marginBottom: 8,
          animation: "float 3s ease-in-out infinite"
        }}>
          {/* Triangle pointer */}
          <div style={{
            position: "absolute",
            bottom: -14,
            right: 40,
            width: 26,
            height: 26,
            background: "linear-gradient(135deg, #ffeef8, #f0f9ff)",
            borderBottom: "4px solid rgba(255, 154, 158, 0.4)",
            borderRight: "4px solid rgba(255, 154, 158, 0.4)",
            transform: "rotate(45deg)"
          }} />
          
          {/* Header with title and close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ 
              fontFamily: "var(--font-fun)", 
              fontSize: 18, 
              fontWeight: 800, 
              background: "linear-gradient(135deg, #ff9a9e, #a18cd1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              🌸 Dhyan
              {currentMode !== "chat" && (
                <span style={{ 
                  fontSize: 11, 
                  marginLeft: 6,
                  padding: "4px 10px",
                  background: currentMode === "song" ? "linear-gradient(135deg, #fa709a, #fee140)" :
                             currentMode === "story" ? "linear-gradient(135deg, #e0c3fc, #8ec5fc)" :
                             currentMode === "game" ? "linear-gradient(135deg, #43e97b, #38f9d7)" :
                             "linear-gradient(135deg, #ff9a9e, #a18cd1)",
                  borderRadius: 14,
                  color: "white",
                  fontWeight: 700,
                  WebkitTextFillColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  {currentMode === "song" ? "🎵 Singing" : 
                   currentMode === "poem" ? "📜 Poetry" :
                   currentMode === "story" ? "📚 Story" :
                   currentMode === "book" ? "📖 Reading" :
                   currentMode === "game" ? "🎮 Gaming" : ""}
                </span>
              )}
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                opacity: 0.5
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Sound wave animation */}
          {isSpeaking && (
            <div style={{ 
              display: "flex", 
              gap: 3, 
              marginBottom: 12, 
              justifyContent: "center",
              padding: "8px",
              background: "var(--cute-primary-soft)",
              borderRadius: 12
            }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{
                  width: 4,
                  height: 10 + i * 5,
                  background: "var(--cute-primary)",
                  borderRadius: 2,
                  animation: `soundWave 0.5s ease-in-out ${i * 0.1}s infinite alternate`
                }} />
              ))}
            </div>
          )}
          
          {/* Listening indicator */}
          {isListening && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
              padding: "10px 16px",
              background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
              borderRadius: 14,
              border: "2px dashed rgba(255, 154, 158, 0.5)"
            }}>
              <span style={{
                width: 10,
                height: 10,
                background: "linear-gradient(135deg, #ff9a9e, #fecfef)",
                borderRadius: "50%",
                animation: "pulse 1s ease-in-out infinite",
                boxShadow: "0 0 8px rgba(255, 154, 158, 0.5)"
              }} />
              <span style={{ fontFamily: "var(--font-fun)", fontSize: 13, color: "#d63384", fontWeight: 700 }}>
                🎤 I'm listening...
              </span>
            </div>
          )}

          {/* NEW: Wake Word Detected Indicator */}
          {showWakeWordIndicator && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
              padding: "12px 18px",
              background: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
              borderRadius: 16,
              border: "3px solid rgba(255, 107, 107, 0.5)",
              animation: "bounce-in 0.5s ease"
            }}>
              <span style={{
                fontSize: 24,
                animation: "pulse 0.5s ease-in-out infinite"
              }}>
                🎯
              </span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontFamily: "var(--font-fun)", fontSize: 14, color: "#d63384", fontWeight: 800, display: "block" }}>
                  Hey Dhyan detected!
                </span>
                <span style={{ fontFamily: "var(--font-fun)", fontSize: 11, color: "#6c757d" }}>
                  I'm here and ready to help!
                </span>
              </div>
            </div>
          )}

          {/* NEW: Wake Word Listening Status */}
          {wakeWordEnabled && !isListening && isListeningForWakeWord && !showWakeWordIndicator && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 10,
              padding: "6px 12px",
              background: "rgba(132, 250, 176, 0.2)",
              borderRadius: 20,
              border: "1px dashed rgba(67, 233, 123, 0.4)"
            }}>
              <span style={{
                width: 8,
                height: 8,
                background: "linear-gradient(135deg, #43e97b, #38f9d7)",
                borderRadius: "50%",
                animation: "pulse 2s ease-in-out infinite"
              }} />
              <span style={{ fontFamily: "var(--font-fun)", fontSize: 11, color: "#198754", fontWeight: 600 }}>
                Say "Hey Dhyan" to wake me!
              </span>
            </div>
          )}
          
          {/* Current Message */}
          <p style={{
            fontFamily: "var(--font-fun)",
            fontSize: 14,
            margin: "0 0 16px 0",
            color: "#495057",
            lineHeight: 1.7,
            maxHeight: 120,
            overflowY: "auto"
          }}>
            {currentMessage}
          </p>
          
          {/* Content Display (when showing songs/poems/stories) */}
          {currentContent && (
            <div style={{
              padding: 14,
              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              borderRadius: 16,
              marginBottom: 12,
              fontSize: 13,
              border: "2px solid rgba(255, 154, 158, 0.3)",
              boxShadow: "0 4px 12px rgba(255, 154, 158, 0.15)"
            }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#d63384", fontSize: 14 }}>
                � Now Playing: {currentContent.title}
              </p>
              {currentContent.author && (
                <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#6c757d", fontWeight: 500 }}>
                  ✨ by {currentContent.author}
                </p>
              )}
            </div>
          )}
          
          {/* NEW: Game State Display */}
          {gameState.isPlaying && (
            <div style={{
              padding: 14,
              background: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
              borderRadius: 16,
              marginBottom: 12,
              fontSize: 13,
              border: "2px solid rgba(67, 233, 123, 0.4)",
              boxShadow: "0 4px 16px rgba(67, 233, 123, 0.25)",
              animation: "bounce-in 0.5s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 800, color: "#198754", fontSize: 14 }}>
                  🎮 {gameState.type?.charAt(0).toUpperCase() + gameState.type?.slice(1)} Game
                </span>
                <span style={{ fontWeight: 800, color: "#0d6efd", fontSize: 18, background: "white", padding: "2px 10px", borderRadius: 12 }}>
                  ⭐ {gameState.score}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#495057" }}>
                <span style={{ fontWeight: 600 }}>🔥 Streak: {gameState.streak}</span>
                <span style={{ fontWeight: 600 }}>📋 {gameState.questionsAnswered + 1}/5</span>
              </div>
              {gameState.waitingForAnswer && (
                <div style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#d63384",
                  fontWeight: 700,
                  textAlign: "center",
                  border: "2px dashed rgba(255, 154, 158, 0.4)"
                }}>
                  🎤 Speak your answer...
                </div>
              )}

              {/* STICKER DISPLAY: Shapes Game */}
              {gameState.type === 'shapes' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="shape-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                </div>
              )}

              {/* STICKER DISPLAY: Memory Game */}
              {gameState.type === 'memory' && gameState.currentQuestion?.items && (
                <div style={{ marginTop: 15 }}>
                  <div className="memory-sticker-container">
                    {gameState.currentQuestion.items.map((item, idx) => (
                      <div key={idx} className="memory-card sticker-pop">
                        {item.sticker}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STICKER DISPLAY: Patterns Game */}
              {gameState.type === 'patterns' && gameState.currentQuestion?.sequence && (
                <div style={{ marginTop: 15 }}>
                  <div className="sticker-sequence">
                    {gameState.currentQuestion.sequence.map((item, idx) => (
                      <div key={idx} className="pattern-sticker">
                        {/* Render pattern stickers based on type */}
                        {gameState.currentQuestion.type === 'pattern' && PatternStickers[item]}
                        {gameState.currentQuestion.type === 'animal' && AnimalStickers[item]}
                        {gameState.currentQuestion.type === 'fruit' && FruitStickers[item]}
                        {gameState.currentQuestion.type === 'number' && NumberStickers[item]}
                        {gameState.currentQuestion.type === 'letter' && NumberStickers[item]}
                      </div>
                    ))}
                    <span className="sticker-separator">→</span>
                    <div className="pattern-sticker" style={{ border: "3px dashed #ff9a9e", borderRadius: "50%" }}>
                      {/* Question mark for the missing item */}
                      <span style={{ fontSize: 24, color: "#ff9a9e" }}>?</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STICKER DISPLAY: Animal Sounds Game */}
              {gameState.type === 'animalSounds' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="animal-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    Listen to the sound and guess the animal!
                  </p>
                </div>
              )}

              {/* COLOR PREVIEW: Colors Game */}
              {gameState.type === 'colors' && gameState.currentQuestion?.hex && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div 
                    style={{ 
                      width: 120, 
                      height: 120, 
                      borderRadius: 20, 
                      backgroundColor: gameState.currentQuestion.hex,
                      display: "inline-block",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)",
                      border: "4px solid white"
                    }}
                  />
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    What color is this?
                  </p>
                </div>
              )}

              {/* STICKER DISPLAY: Spelling Game */}
              {gameState.type === 'spelling' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="spelling-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    Hint: {gameState.currentQuestion.hint}
                  </p>
                </div>
              )}

              {/* STICKER DISPLAY: Word Scramble Game */}
              {gameState.type === 'wordScramble' && gameState.currentQuestion?.sticker && (
                <div style={{ marginTop: 15, textAlign: "center" }}>
                  <div className="word-scramble-sticker" style={{ display: "inline-block" }}>
                    {gameState.currentQuestion.sticker}
                  </div>
                  <p style={{ marginTop: 10, fontSize: 14, color: "#666", fontStyle: "italic" }}>
                    Hint: {gameState.currentQuestion.hint}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Main Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Media Controls */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => processCommand("sing a song")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(250, 112, 154, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                🎵 Song
              </button>
              <button
                onClick={() => processCommand("read a poem")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(161, 140, 209, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                📜 Poem
              </button>
              <button
                onClick={() => processCommand("tell me a story")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(132, 250, 176, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                📚 Story
              </button>
              <button
                onClick={() => processCommand("read a book")}
                disabled={isSpeaking}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: isSpeaking ? "#e9ecef" : "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
                  color: isSpeaking ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  boxShadow: isSpeaking ? "none" : "0 4px 12px rgba(224, 195, 252, 0.3)",
                  transform: isSpeaking ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !isSpeaking && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSpeaking && (e.target.style.transform = "translateY(0)")}
              >
                📖 Book
              </button>
            </div>
            
            {/* NEW: Game Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => processCommand("play riddles")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(255, 154, 158, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🧩 Riddles
              </button>
              <button
                onClick={() => processCommand("play trivia")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(161, 140, 209, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🎯 Trivia
              </button>
              <button
                onClick={() => processCommand("math quiz")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(252, 182, 159, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🔢 Math
              </button>
              <button
                onClick={() => processCommand("word scramble")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(137, 247, 254, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🎲 Words
              </button>
            </div>

            {/* NEW: Additional Learning Games */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => processCommand("play colors")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(255, 107, 107, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🎨 Colors
              </button>
              <button
                onClick={() => processCommand("play shapes")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(161, 140, 209, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🔷 Shapes
              </button>
              <button
                onClick={() => processCommand("play memory")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(102, 126, 234, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                🧠 Memory
              </button>
              <button
                onClick={() => processCommand("play patterns")}
                disabled={isSpeaking || gameState.isPlaying}
                style={{
                  flex: 1,
                  minWidth: 70,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: (isSpeaking || gameState.isPlaying) ? "#e9ecef" : "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  color: (isSpeaking || gameState.isPlaying) ? "#adb5bd" : "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (isSpeaking || gameState.isPlaying) ? "not-allowed" : "pointer",
                  opacity: (isSpeaking || gameState.isPlaying) ? 0.6 : 1,
                  boxShadow: (isSpeaking || gameState.isPlaying) ? "none" : "0 4px 12px rgba(17, 153, 142, 0.3)",
                  transform: (isSpeaking || gameState.isPlaying) ? "none" : "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !(isSpeaking || gameState.isPlaying) && (e.target.style.transform = "translateY(0)")}
              >
                📊 Patterns
              </button>
            </div>

            {/* Utility Buttons - FIXED: Added visual feedback */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const msg = stats 
                    ? `📊 Your Progress: ${stats.total_sessions || 0} games played, ${stats.completed_sessions || 0} completed. ${stats.total_sessions >= 5 ? "You're doing amazing! 🌟" : "Keep playing to improve! 💪"}`
                    : "📊 No stats yet. Try playing some games first! 🎮";
                  setCurrentMessage(msg);
                  speak(msg, "thinking");
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(255, 154, 158, 0.25)",
                  transition: "all 0.2s ease",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                📊 Stats
              </button>
              <button
                onClick={() => {
                  const encouragements = [
                    "🌟 You are capable of amazing things! Every expert was once a beginner. Keep going!",
                    "💪 Believe in yourself! You have unique talents that nobody else has. Shine bright!",
                    "🌈 Mistakes help us learn and grow. Don't give up - you're getting better every day!",
                    "⭐ You are braver than you believe, stronger than you seem, and smarter than you think!",
                    "🎯 The only way to do great work is to love what you do. You're doing great!"
                  ];
                  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
                  setCurrentMessage(msg);
                  speak(msg, "celebrating");
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(250, 208, 196, 0.25)",
                  transition: "all 0.2s ease",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                💪 Encourage
              </button>
              <button
                onClick={() => {
                  const jokes = [
                    "😄 Why don't scientists trust atoms? Because they make up everything!",
                    "🤣 Why did the scarecrow win an award? Because he was outstanding in his field!",
                    "😂 Why don't eggs tell jokes? They'd crack each other up!",
                    "🎭 What do you call a fake noodle? An impasta!"
                  ];
                  const msg = jokes[Math.floor(Math.random() * jokes.length)];
                  setCurrentMessage(msg);
                  speak(msg, "excited");
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(137, 247, 254, 0.25)",
                  transition: "all 0.2s ease",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => e.target.style.transform = "scale(0.95)"}
                onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                😄 Joke
              </button>
            </div>

            {/* NEW: Wake Word Toggle */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={toggleWakeWord}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: wakeWordEnabled
                    ? "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
                    : "linear-gradient(135deg, #ddd 0%, #bbb 100%)",
                  color: wakeWordEnabled ? "#0d6efd" : "#666",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: wakeWordEnabled
                    ? "0 4px 12px rgba(132, 250, 176, 0.35)"
                    : "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 14 }}>
                  {wakeWordEnabled ? "🎧" : "🔇"}
                </span>
                {wakeWordEnabled ? "Wake Word: ON" : "Wake Word: OFF"}
              </button>
            </div>

            {/* NEW: Breathing Exercise Button */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={startBreathingExercise}
                disabled={breathingActive}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: breathingActive
                    ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: breathingActive ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => !breathingActive && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 14 }}>🧘</span>
                {breathingActive ? `Breathing: ${breathingPhase}` : "Calm Down"}
              </button>
            </div>

            {/* NEW: Avatar Selection */}
            <div style={{
              marginTop: 10,
              padding: 10,
              background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
              borderRadius: 14,
              border: "2px dashed rgba(255, 154, 158, 0.3)"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#d63384", fontWeight: 700 }}>
                🎭 Choose Your Friend
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => changeAvatar(avatar)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: selectedAvatar === avatar ? "3px solid #ff9a9e" : "2px solid transparent",
                      background: selectedAvatar === avatar ? "#fff" : "rgba(255,255,255,0.5)",
                      fontSize: 20,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      transform: selectedAvatar === avatar ? "scale(1.1)" : "scale(1)"
                    }}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: Daily Challenges */}
            <div style={{
              marginTop: 10,
              padding: 12,
              background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
              borderRadius: 14,
              border: "2px solid rgba(255, 154, 158, 0.3)"
            }}>
              <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#d63384", fontWeight: 800 }}>
                📋 Daily Challenges
              </p>
              {dailyChallenges.map(challenge => (
                <div key={challenge.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px dashed rgba(0,0,0,0.1)"
                }}>
                  <span style={{ fontSize: 11, color: challenge.completed ? "#28a745" : "#495057" }}>
                    {challenge.completed ? "✅" : "⏳"} {challenge.title}
                  </span>
                  <span style={{ fontSize: 10, color: "#6c757d", fontWeight: 600 }}>
                    {challenge.current}/{challenge.target}
                  </span>
                </div>
              ))}
            </div>

            {/* NEW: Streak Calendar */}
            <div style={{
              marginTop: 10,
              padding: 12,
              background: "linear-gradient(135deg, #84fab0, #8fd3f4)",
              borderRadius: 14
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#0d6efd", fontWeight: 800 }}>
                  🔥 Streak: {streakData.currentStreak} days
                </span>
                {!dailyRewardClaimed && (
                  <button
                    onClick={claimDailyReward}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 10,
                      border: "none",
                      background: "#ffd700",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🎁 Claim!
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: 24,
                    borderRadius: 6,
                    background: streakData.weeklyProgress[i] ? "#0d6efd" : "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: streakData.weeklyProgress[i] ? "white" : "#6c757d"
                  }}>
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Creative Mode Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={startStoryCreator}
                disabled={storyCreatorActive}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: storyCreatorActive
                    ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                    : "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: storyCreatorActive ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(250, 112, 154, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => !storyCreatorActive && (e.target.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 16 }}>📚</span>
                {storyCreatorActive ? "Creating Story..." : "Create Story"}
              </button>

              <button
                onClick={toggleRewardShop}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: rewardShopOpen
                    ? "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
                    : "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                  color: "#0d6efd",
                  fontFamily: "var(--font-fun)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(132, 250, 176, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
                onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                <span style={{ fontSize: 16 }}>🏪</span>
                {rewardShopOpen ? "Close Shop" : "Reward Shop"}
              </button>
            </div>

            {/* NEW: Story Creator Active Display */}
            {storyCreatorActive && (
              <div style={{
                marginTop: 10,
                padding: 15,
                background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
                borderRadius: 14,
                border: "3px dashed rgba(255, 154, 158, 0.5)"
              }}>
                <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#d63384", fontWeight: 800 }}>
                  📖 Story Creator Mode
                </p>
                <div style={{ fontSize: 11, color: "#495057", lineHeight: "1.5" }}>
                  {!createdStory.character && "🎯 Step 1: Pick a character (knight, fox, princess, dragon, robot)"}
                  {createdStory.character && !createdStory.setting && "🎯 Step 2: Choose setting (forest, space, underwater, castle, jungle)"}
                  {createdStory.setting && !createdStory.problem && "🎯 Step 3: What's the problem? (treasure, villain, storm, puzzle, monster)"}
                  {createdStory.problem && !createdStory.resolution && "🎯 Step 4: How is it solved? (magic, friends, never give up, clever, kindness)"}
                  {createdStory.fullStory && "✨ Your story is complete! Listen above!"}
                </div>
                {createdStory.character && (
                  <div style={{ marginTop: 8, padding: 8, background: "#fff", borderRadius: 8 }}>
                    <span style={{ fontSize: 20 }}>{createdStory.character.emoji}</span>
                    <span style={{ fontSize: 10, color: "#6c757d", marginLeft: 5 }}>{createdStory.character.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* NEW: Reward Shop Panel */}
            {rewardShopOpen && (
              <div style={{
                marginTop: 10,
                padding: 15,
                background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
                borderRadius: 14,
                border: "2px solid rgba(255, 154, 158, 0.5)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#d63384", fontWeight: 800 }}>
                    🏪 Reward Shop
                  </p>
                  <span style={{ fontSize: 12, color: "#0d6efd", fontWeight: 700, background: "#fff", padding: "4px 10px", borderRadius: 10 }}>
                    💰 {totalScore} pts
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { id: 'bg_stars', name: 'Star Background', cost: 100, type: 'background', icon: '✨' },
                    { id: 'bg_rainbow', name: 'Rainbow Background', cost: 200, type: 'background', icon: '🌈' },
                    { id: 'frame_gold', name: 'Gold Frame', cost: 150, type: 'frame', icon: '🖼️' },
                    { id: 'badge_crown', name: 'Crown Badge', cost: 300, type: 'badge', icon: '👑' },
                    { id: 'badge_star', name: 'Star Badge', cost: 250, type: 'badge', icon: '⭐' }
                  ].map(item => (
                    <div key={item.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: purchasedItems.includes(item.id) ? "#d4edda" : "#fff",
                      borderRadius: 10,
                      border: equippedItems[item.type] === item.id ? "2px solid #28a745" : "1px solid rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        <span style={{ fontSize: 11, color: "#495057", fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {purchasedItems.includes(item.id) ? (
                          <button
                            onClick={() => equipItem(item)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: equippedItems[item.type] === item.id ? "#28a745" : "#6c757d",
                              color: "white",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            {equippedItems[item.type] === item.id ? "Equipped" : "Equip"}
                          </button>
                        ) : (
                          <button
                            onClick={() => purchaseItem(item)}
                            disabled={totalScore < item.cost}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: totalScore >= item.cost ? "#ffd700" : "#e9ecef",
                              color: totalScore >= item.cost ? "#333" : "#adb5bd",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: totalScore >= item.cost ? "pointer" : "not-allowed"
                            }}
                          >
                            💰 {item.cost}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEW: Sound Effects Toggle */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "none",
                  background: soundEnabled
                    ? "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
                    : "linear-gradient(135deg, #ddd 0%, #bbb 100%)",
                  color: soundEnabled ? "white" : "#666",
                  fontFamily: "var(--font-fun)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: soundEnabled ? "0 4px 12px rgba(137, 247, 254, 0.35)" : "none",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span style={{ fontSize: 14 }}>{soundEnabled ? "🔊" : "🔇"}</span>
                {soundEnabled ? "Sounds: ON" : "Sounds: OFF"}
              </button>

              {soundEnabled && (
                <div style={{ flex: 1, padding: "0 10px" }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            {/* NEW: Emotion Detection Display */}
            {detectedEmotion !== 'neutral' && (
              <div style={{
                marginTop: 10,
                padding: 10,
                background: detectedEmotion === 'happy' ? "linear-gradient(135deg, #fff5f7, #ffeef8)" :
                           detectedEmotion === 'sad' ? "linear-gradient(135deg, #e3f2fd, #bbdefb)" :
                           detectedEmotion === 'angry' ? "linear-gradient(135deg, #ffebee, #ffcdd2)" :
                           "linear-gradient(135deg, #f3e5f5, #e1bee7)",
                borderRadius: 14,
                textAlign: "center"
              }}>
                <span style={{ fontSize: 20 }}>
                  {detectedEmotion === 'happy' && "😊"}
                  {detectedEmotion === 'sad' && "😢"}
                  {detectedEmotion === 'angry' && "😠"}
                  {detectedEmotion === 'fear' && "😨"}
                  {detectedEmotion === 'surprised' && "😲"}
                </span>
                <span style={{ fontSize: 11, color: "#6c757d", marginLeft: 8 }}>
                  Feeling {detectedEmotion}
                </span>
              </div>
            )}

            {/* NEW: Seasonal Indicator */}
            <div style={{
              marginTop: 10,
              padding: 8,
              background: seasonalContent[currentSeason].colors[0] + "20",
              borderRadius: 10,
              textAlign: "center"
            }}>
              <span style={{ fontSize: 11, color: "#6c757d" }}>
                {currentSeason === 'spring' && "🌸 Spring Theme Active"}
                {currentSeason === 'summer' && "☀️ Summer Theme Active"}
                {currentSeason === 'fall' && "🍂 Fall Theme Active"}
                {currentSeason === 'winter' && "❄️ Winter Theme Active"}
              </span>
            </div>

            {/* Voice Command Button */}
            <button
              onClick={startListening}
              disabled={isListening || isSpeaking}
              style={{
                padding: "12px 20px",
                borderRadius: 18,
                border: "3px solid rgba(255, 154, 158, 0.5)",
                background: isListening ? "linear-gradient(135deg, #ff9a9e, #fecfef)" : "white",
                color: isListening ? "white" : "#d63384",
                fontFamily: "var(--font-fun)",
                fontSize: 14,
                fontWeight: 800,
                cursor: (isListening || isSpeaking) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: isListening ? "0 4px 16px rgba(255, 154, 158, 0.4)" : "0 4px 12px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease"
              }}
            >
              {isListening ? "🎤 Listening..." : isSpeaking ? "🔊 Speaking..." : "🎤 Click & Speak"}
            </button>
            
            {/* Help Text */}
            <p style={{
              fontSize: 12,
              color: "#6c757d",
              margin: "10px 0 0 0",
              textAlign: "center",
              fontFamily: "var(--font-fun)",
              fontWeight: 500
            }}>
              🎤 Say "<b>Hey Dhyan</b>" anytime • Or try: "sing" • "story" • "riddles"
            </p>

            {/* ENHANCED: Voice Speed & Pitch Controls */}
            <div style={{
              marginTop: 12,
              padding: 10,
              background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#6c757d", fontWeight: 600 }}>
                🎛️ Voice Settings
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#6c757d", display: "block", marginBottom: 4 }}>
                    Speed: {voiceSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#6c757d", display: "block", marginBottom: 4 }}>
                    Pitch: {voicePitch.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* ENHANCED: Session Stats */}
            {(totalScore > 0 || sessionStreak > 0) && (
              <div style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                justifyContent: "center"
              }}>
                {totalScore > 0 && (
                  <span style={{
                    padding: "4px 10px",
                    background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#d63384",
                    fontWeight: 700
                  }}>
                    🏆 Total: {totalScore}
                  </span>
                )}
                {sessionStreak > 0 && (
                  <span style={{
                    padding: "4px 10px",
                    background: "linear-gradient(135deg, #84fab0, #8fd3f4)",
                    borderRadius: 12,
                    fontSize: 11,
                    color: "#0d6efd",
                    fontWeight: 700
                  }}>
                    🔥 Streak: {sessionStreak}
                  </span>
                )}
              </div>
            )}

            {/* ENHANCED: Achievement Display */}
            {achievements.length > 0 && (
              <div style={{
                marginTop: 10,
                padding: 8,
                background: "linear-gradient(135deg, #fff5f7, #ffeef8)",
                borderRadius: 12,
                border: "2px dashed rgba(255, 154, 158, 0.3)"
              }}>
                <p style={{ margin: "0 0 6px 0", fontSize: 10, color: "#d63384", fontWeight: 700 }}>
                  🏅 Achievements ({achievements.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {achievements.slice(-5).map((a, i) => (
                    <span key={i} style={{
                      fontSize: 20,
                      animation: "bounce 0.5s ease"
                    }} title={a.title}>
                      {a.icon}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ENHANCED: Achievement Popup */}
          {showAchievement && (
            <div style={{
              position: "fixed",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10000,
              animation: "bounce-in 0.5s ease"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #ffd700, #ffed4e)",
                padding: "20px 30px",
                borderRadius: 20,
                boxShadow: "0 12px 40px rgba(255, 215, 0, 0.4)",
                textAlign: "center",
                border: "4px solid #fff"
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {showAchievement.icon}
                </div>
                <p style={{
                  margin: 0,
                  fontFamily: "var(--font-fun)",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#333"
                }}>
                  Achievement Unlocked!
                </p>
                <p style={{
                  margin: "4px 0 0 0",
                  fontFamily: "var(--font-fun)",
                  fontSize: 14,
                  color: "#666"
                }}>
                  {showAchievement.title}
                </p>
                <p style={{
                  margin: "4px 0 0 0",
                  fontSize: 11,
                  color: "#888"
                }}>
                  {showAchievement.description}
                </p>
              </div>
            </div>
          )}

          {/* ENHANCED: Particle Effects Container */}
          {particles.length > 0 && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 1000,
              overflow: "visible"
            }}>
              {particles.map(p => (
                <div
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    width: p.emoji ? 24 : 8,
                    height: p.emoji ? 24 : 8,
                    fontSize: p.emoji ? 24 : 8,
                    background: p.emoji ? "transparent" : p.color,
                    borderRadius: "50%",
                    transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                    opacity: p.life,
                    animation: "float-up 2s ease-out forwards"
                  }}
                >
                  {p.emoji}
                </div>
              ))}
            </div>
          )}

          {/* ENHANCED: Floating Emojis */}
          {floatingEmojis.map(e => (
            <div
              key={e.id}
              style={{
                position: "absolute",
                left: e.x,
                top: e.y,
                fontSize: 32,
                animation: "float-up 3s ease-out forwards",
                pointerEvents: "none",
                zIndex: 1001
              }}
            >
              {e.emoji}
            </div>
          ))}

          {/* System Logs (collapsible) */}
          {systemLogs.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-fun)"
              }}>
                📋 System Logs ({systemLogs.length})
              </summary>
              <div style={{
                marginTop: 8,
                padding: 8,
                background: "var(--color-bg-tertiary)",
                borderRadius: 8,
                maxHeight: 100,
                overflowY: "auto",
                fontSize: 10,
                fontFamily: "monospace"
              }}>
                {systemLogs.map((log, i) => (
                  <div key={i} style={{
                    color: log.type === "error" ? "var(--cute-error)" : 
                           log.type === "success" ? "var(--cute-success)" : 
                           "var(--color-text-secondary)",
                    marginBottom: 2
                  }}>
                    [{log.timestamp}] {log.type}: {log.message}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
      
      {/* Avatar Button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              padding: "10px 18px",
              borderRadius: 20,
              border: "none",
              background: "white",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              fontFamily: "var(--font-fun)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              color: "var(--cute-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            💬 Talk to me!
          </button>
        )}
        
        <button
          onClick={() => {
            setIsExpanded(true);
            const greetings = [
              `Hi! Try saying "sing a song" or "tell me a story"!`,
              `Hello! I can read books, poems, and more!`,
              `Hey! Click the microphone to talk to me!`
            ];
            speak(greetings[Math.floor(Math.random() * greetings.length)], "happy");
          }}
          style={{
            width: 75,
            height: 75,
            borderRadius: "50%",
            background: getCurrentColor(),
            border: "4px solid white",
            fontSize: 40,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(99, 102, 241, 0.3)",
            animation: isSpeaking ? "bounce-soft 0.4s ease-in-out infinite" : "bounce-soft 2s ease-in-out infinite",
            transition: "all 0.3s ease",
            position: "relative"
          }}
        >
          {getCurrentAvatar()}
          
          {/* Status indicator */}
          <span style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: isSpeaking ? "#10b981" : isListening ? "#f59e0b" : "#6366f1",
            border: "3px solid white",
            animation: (isSpeaking || isListening) ? "pulse 1s ease-in-out infinite" : "none"
          }} />
        </button>
      </div>
    </div>
  );
}

// Floating Particles Component
function FloatingParticles() {
  const particles = ['⭐', '🎯', '🎨', '🎪', '🎭', '🎸'];
  return (
    <div className="particles">
      {particles.map((emoji, i) => (
        <div 
          key={i} 
          className="particle" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${i * 3}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [children, setChildren] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      listChildren().catch(() => []),
      getSessionHistory({ limit: 10 }).catch(() => []),
    ]).then(([s, c, h]) => {
      setStats(s);
      setChildren(Array.isArray(c) ? c : []);
      setSessions(Array.isArray(h) ? h : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) {
      setChildProgress(null);
      return;
    }
    getChildProgress(selectedChild)
      .then(setChildProgress)
      .catch(() => setChildProgress(null));
  }, [selectedChild]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container page-content">
          <div className="dashboard-header">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">Loading your data...</p>
            </div>
          </div>
          <SkeletonStatCards count={4} />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    );
  }

  const chartData = childProgress?.game_breakdown?.map((g) => ({
    name: g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    accuracy: Math.round(g.accuracy * 100),
    sessions: g.sessions,
    trials: g.total_trials,
  })) || [];

  const trendData = [...sessions].reverse().map((s, i) => ({
    idx: i + 1,
    accuracy: Math.round(s.accuracy * 100),
    trials: s.total_trials,
  }));

  const weeklyAcc = stats ? Math.round(stats.weekly_accuracy * 100) : 0;

  // Random encouraging messages
  const encouragingMessages = [
    "You're doing amazing! 🌟",
    "Keep up the great work! 💪",
    "Every step counts! 🎯",
    "You're a superstar! ⭐",
    "Learning is fun with you! 🎨"
  ];

  const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  return (
    <div className="page-wrapper">
      {/* Cute Animated Background Elements */}
      <div className="cute-overlay" />
      <div className="dot-pattern" />
      <div className="wave-bottom" />
      
      {/* Floating Decorations */}
      <div className="floating-decoration cloud1">☁️</div>
      <div className="floating-decoration cloud2">☁️</div>
      <div className="floating-decoration star1">⭐</div>
      <div className="floating-decoration star2">✨</div>
      <div className="floating-decoration heart1">💕</div>
      <div className="floating-decoration heart2">💖</div>
      
      <FloatingParticles />
      
      <div className="container page-content dashboard-container">
        <div className="page-header-cute" style={{ marginBottom: 32 }}>
          <div className="dashboard-title-section">
            <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0] || 'Friend'}! 👋</h1>
            <p className="page-subtitle">Ready to learn and have fun today?</p>
          </div>
          <div className="dashboard-actions" style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="btn btn-cute btn-cute-primary"
              onClick={() => navigate("/games")}
            >
              <UiIcon name="games" size={18} />
              Play Games!
            </button>
            <button
              className="btn btn-cute btn-cute-success"
              onClick={() => navigate("/therapist")}
            >
              <UiIcon name="chart" size={18} />
              Console
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card-cute card-cute-primary" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: 8 }}>
            <div className="sparkle" style={{ 
              width: 80, 
              height: 80, 
              borderRadius: "var(--radius-xl)", 
              background: "linear-gradient(135deg, var(--cute-warning) 0%, var(--cute-orange) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40
            }}>
              <span className="heart-beat">👋</span>
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-fun)", fontSize: 24, fontWeight: 800, margin: "0 0 8px 0" }}>
                Welcome back, {user?.full_name?.split(' ')[0] || "Friend"}!
              </h2>
              <p style={{ fontSize: 16, color: "var(--color-text-secondary)", margin: 0 }}>
                Ready to learn and have fun today? 🎮
              </p>
            </div>
          </div>
        </div>

      {stats && (
        <div className="stats-grid">
          <StatCard
            iconName="child"
            label="My Kids"
            value={stats.total_children}
            accent="primary"
            subtitle="Children registered"
          />
          <StatCard
            iconName="games"
            label="Games Played"
            value={stats.total_sessions}
            accent="success"
            subtitle="Total sessions"
          />
          <StatCard
            iconName="trophy"
            label="Completed"
            value={stats.completed_sessions}
            accent="warning"
            subtitle="Finished sessions"
          />
          <StatCard
            iconName="star"
            label="This Week"
            value={stats.recent_trials_7d}
            accent="danger"
            subtitle="Recent trials"
          />
        </div>
      )}

      <div className="panel" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <UiIcon name="trophy" size={22} title="" />
            Achievements
          </h3>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
            {Math.min(stats?.total_sessions || 0, 5)} of 5 unlocked
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <AchievementBadge
            iconName="games"
            title="First Game"
            description="Play your first game"
            unlocked={(stats?.total_sessions || 0) >= 1}
          />
          <AchievementBadge
            iconName="star"
            title="High Scorer"
            description="Get 80% accuracy"
            unlocked={weeklyAcc >= 80}
          />
          <AchievementBadge
            iconName="calendar"
            title="Weekly Warrior"
            description="5 sessions in a week"
            unlocked={(stats?.recent_sessions_7d || 0) >= 5}
          />
          <AchievementBadge
            iconName="child"
            title="Helper"
            description="Register a child"
            unlocked={(stats?.total_children || 0) >= 1}
          />
          <AchievementBadge
            iconName="trophy"
            title="Expert"
            description="Complete 10 sessions"
            unlocked={(stats?.total_sessions || 0) >= 10}
          />
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
              <UiIcon
                name={weeklyAcc >= 80 ? "star" : weeklyAcc >= 50 ? "thumbs-up" : "dumbbell"}
                size={48}
                title=""
              />
            </div>
            <ProgressRing
              value={weeklyAcc}
              size={120}
              strokeWidth={10}
              color={weeklyAcc >= 80 ? "#48bb78" : weeklyAcc >= 50 ? "#f6ad55" : "#fc8181"}
            />
            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15 }}>Weekly Accuracy</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{stats.recent_sessions_7d} sessions this week</div>
            <div style={{ marginTop: 8, padding: "4px 12px", background: weeklyAcc >= 80 ? "rgba(72, 187, 120, 0.2)" : "rgba(246, 173, 85, 0.2)", borderRadius: "12px", fontSize: "12px", fontWeight: "600", color: weeklyAcc >= 80 ? "#276749" : "#c05621" }}>
              {weeklyAcc >= 80 ? "Excellent!" : weeklyAcc >= 50 ? "Good progress!" : "Keep trying!"}
            </div>
          </div>

          {trendData.length > 1 ? (
            <div className="chart-container">
              <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UiIcon name="chart" size={20} title="" />
                Your Learning Journey
              </div>
              <RechartsContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="idx" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: "#161922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ display: "none" }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#6366f1" fill="url(#accGrad)" strokeWidth={2} />
                </AreaChart>
              </RechartsContainer>
            </div>
          ) : (
            <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="empty-state" style={{ padding: 16 }}>
                <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center" }}>
                  <UiIcon name="chart" size={36} title="" />
                </div>
                <div className="empty-state-desc">Play more sessions to see trends</div>
              </div>
            </div>
          )}
        </div>
      )}

      {children.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Child Progress</h3>
          <div className="row" style={{ marginBottom: 12 }}>
            <select
              className="input"
              value={selectedChild || ""}
              onChange={(e) => setSelectedChild(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Select a child...</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </div>

          {childProgress && (
            <div>
              <div className="stats-grid" style={{ marginBottom: 16 }}>
                <StatCard label="Sessions" value={childProgress.total_sessions} />
                <StatCard label="Completed" value={childProgress.completed_sessions} />
                <StatCard label="Total Trials" value={childProgress.total_trials} />
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <ProgressRing
                    value={Math.round(childProgress.overall_accuracy * 100)}
                    size={64}
                    strokeWidth={6}
                    color={childProgress.overall_accuracy >= 0.8 ? "#10b981" : childProgress.overall_accuracy >= 0.5 ? "#f59e0b" : "#ef4444"}
                  />
                  <div className="stat-label" style={{ marginTop: 6 }}>Accuracy</div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="chart-container">
                  <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UiIcon name="games" size={20} title="" />
                    Game Breakdown
                  </div>
                  <RechartsContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={32}>
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#161922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                        formatter={(v, name) => [name === "accuracy" ? `${v}%` : v, name === "accuracy" ? "Accuracy" : "Sessions"]}
                      />
                      <Bar dataKey="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </RechartsContainer>
                </div>
              )}

              {childProgress.game_breakdown?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Game</th>
                          <th>Sessions</th>
                          <th>Trials</th>
                          <th>Correct</th>
                          <th>Accuracy</th>
                          <th>Avg RT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childProgress.game_breakdown.map((g, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{g.game.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                            <td>{g.sessions}</td>
                            <td>{g.total_trials}</td>
                            <td>{g.correct}</td>
                            <td>
                              <span className={`accuracy-badge ${g.accuracy >= 0.8 ? "acc-high" : g.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                                {(g.accuracy * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td>{g.avg_response_time_ms ? `${g.avg_response_time_ms}ms` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {sessions.length > 0 ? (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>Recent Sessions</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Child</th>
                  <th>Game</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.session_date}</td>
                    <td style={{ fontWeight: 600 }}>{s.child_name}</td>
                    <td>
                      {(s.game_types || [])
                        .map((g) => g.replace(/_/g, " "))
                        .join(", ") || s.title}
                    </td>
                    <td>
                      <span className={`status-badge status-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.correct}/{s.total_trials}</td>
                    <td>
                      <span className={`accuracy-badge ${s.accuracy >= 0.8 ? "acc-high" : s.accuracy >= 0.5 ? "acc-mid" : "acc-low"}`}>
                        {(s.accuracy * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center" }}>
              <UiIcon name="games" size={36} title="" />
            </div>
            <div className="empty-state-title">No Sessions Yet</div>
            <div className="empty-state-desc">Start a game session to see your progress here.</div>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/games")} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <UiIcon name="play" size={18} title="" />
              Play Now
            </button>
          </div>
        </div>
      )}
      </div>
      
      {/* AI Agent Panel - Multi-Agent Chat Interface */}
      <AIAgentPanel initialAgent="gameHelper" />
    </div>
  );
}

function StatCard({ iconName, label, value, accent, subtitle }) {
  return (
    <div className={`stat-card ${accent ? `stat-card-${accent}` : ""}`} style={{ position: "relative", overflow: "hidden" }}>
      {iconName && (
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
          <UiIcon name={iconName} size={28} title="" />
        </div>
      )}
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{label}</div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function AchievementBadge({ iconName, title, description, unlocked }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 12px",
        borderRadius: "12px",
        background: unlocked ? "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,185,0,0.1))" : "rgba(0,0,0,0.03)",
        border: unlocked ? "2px solid #ffd700" : "2px solid transparent",
        transition: "all 0.3s ease",
        opacity: unlocked ? 1 : 0.6,
        transform: unlocked ? "scale(1)" : "scale(0.95)"
      }}
    >
      <div style={{
        marginBottom: 8,
        display: "flex",
        justifyContent: "center",
        filter: unlocked ? "none" : "grayscale(100%)",
        opacity: unlocked ? 1 : 0.7,
        transition: "all 0.3s ease"
      }}>
        {unlocked ? (
          <UiIcon name={iconName} size={32} title="" />
        ) : (
          <UiIcon name="lock" size={32} title="" />
        )}
      </div>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: unlocked ? "#b8860b" : "var(--muted)",
        textAlign: "center",
        marginBottom: 4
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 10,
        color: "var(--muted)",
        textAlign: "center",
        lineHeight: 1.3
      }}>
        {description}
      </div>
      {unlocked && (
        <div style={{
          position: "absolute",
          top: 4,
          right: 4,
        }}>
          <UiIcon name="sparkles" size={14} title="" />
        </div>
      )}
    </div>
  );
}
