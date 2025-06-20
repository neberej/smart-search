from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def summarize_documents(documents, config):
    summaries = []
    for doc in documents:
        text = doc['text']
        sentences = text.split('.')
        if len(sentences) <= 3:
            summary = text
        else:
            tfidf = TfidfVectorizer().fit_transform(sentences)
            scores = cosine_similarity(tfidf[0:1], tfidf).flatten()
            top_n = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:3]
            summary = '. '.join([sentences[i] for i in sorted(top_n)])
        summaries.append({
            'filename': doc['filename'],
            'summary': summary,
            'full_text': text
        })
    return summaries