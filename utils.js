(function() {
	const alphabet = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliett','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu']
	window.$utils = {
		generateRandomKey() {
			const words = []
			while (words.length < 24) {
				const index = Math.floor((Math.random() * alphabet.length))
				words.push(alphabet[index])
			}
			return words.map(w => w[0]).join('')
		},
		getWordsFromKey(key) {
			const words = []
			for (let i = 0; i < key.length; i++) {
				const index = key.toLowerCase().charCodeAt(i) - 97
				words.push(alphabet[index])
			}
			return words
		}
	}
})()