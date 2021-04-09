package meditation

type Meditation struct {
	Author     string `json:"author"`
	Work       string `json:"work"`
	Name       string `json:"name"`
	AudioURL   string `json:"audioURL"`
	UserId     string `json:"userId"`
	CreatedAt  string `json:"createdAt"`
	ModifiedAt string `json:"modifiedAt"`
}

type MeditationRecord struct {
	Meditation Meditation
}

func (m MeditationRecord) PartitionKey() string {
	return m.Meditation.UserId
}

func (m MeditationRecord) SortKey() string {
	return m.Meditation.Author + "/" + m.Meditation.Work + "/" + m.Meditation.Name
}
