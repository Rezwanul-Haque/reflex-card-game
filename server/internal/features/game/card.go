package game

import "math/rand"

type Suit string

const (
	SuitHearts   Suit = "hearts"
	SuitDiamonds Suit = "diamonds"
	SuitClubs    Suit = "clubs"
	SuitSpades   Suit = "spades"
)

type Rank string

const (
	RankAce   Rank = "A"
	Rank2     Rank = "2"
	Rank3     Rank = "3"
	Rank4     Rank = "4"
	Rank5     Rank = "5"
	Rank6     Rank = "6"
	Rank7     Rank = "7"
	Rank8     Rank = "8"
	Rank9     Rank = "9"
	Rank10    Rank = "10"
	RankJack  Rank = "J"
	RankQueen Rank = "Q"
	RankKing  Rank = "K"
)

type Card struct {
	Suit Suit `json:"suit"`
	Rank Rank `json:"rank"`
}

func (c Card) IsTrigger(rank Rank) bool {
	return c.Rank == rank
}

type Deck struct {
	Cards []Card
	Index int
}

func NewDeck() *Deck {
	suits := []Suit{SuitHearts, SuitDiamonds, SuitClubs, SuitSpades}
	ranks := []Rank{RankAce, Rank2, Rank3, Rank4, Rank5, Rank6, Rank7, Rank8, Rank9, Rank10, RankJack, RankQueen, RankKing}

	cards := make([]Card, 0, 52)
	for _, suit := range suits {
		for _, rank := range ranks {
			cards = append(cards, Card{Suit: suit, Rank: rank})
		}
	}

	return &Deck{Cards: cards, Index: 0}
}

func (d *Deck) Shuffle() {
	rand.Shuffle(len(d.Cards), func(i, j int) {
		d.Cards[i], d.Cards[j] = d.Cards[j], d.Cards[i]
	})
}

func (d *Deck) Next() (Card, bool) {
	if d.Index >= len(d.Cards) {
		return Card{}, false
	}
	card := d.Cards[d.Index]
	d.Index++
	return card, true
}

func (d *Deck) Reset() {
	d.Index = 0
	d.Shuffle()
}

func (d *Deck) Remaining() int {
	return len(d.Cards) - d.Index
}
