import { 
  AnimalStickers, 
  FruitStickers, 
  ShapeStickers, 
  VehicleStickers, 
  ObjectStickers
} from '../components/Stickers';

export const CONTENT_LIBRARY = {
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
      { word: "rainbow", hint: "Colors in the sky after rain", sticker: ShapeStickers.rainbow },
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
      { word: "dinosaur", hint: "Ancient giant reptile", sticker: AnimalStickers.dinosaur },
      { word: "fantastic", hint: "Really great and amazing", sticker: ObjectStickers.star }
    ],
    wordScramble: [
      { scrambled: "E P L A P", answer: "apple", hint: "A red or green fruit", sticker: FruitStickers.apple },
      { scrambled: "Y R A R I N B O W", answer: "rainbow", hint: "Colors in the sky", sticker: ShapeStickers.rainbow },
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
