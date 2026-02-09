package repository

import (
	"context"
	"time"
	"zan6/database"
	"zan6/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SessionRepository struct {
	collection *mongo.Collection
}

func NewSessionRepository() *SessionRepository {
	return &SessionRepository{
		collection: database.DB.Collection("sessions"),
	}
}

// CREATE - Create new session
func (r *SessionRepository) Create(session *models.Session) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	session.CreatedAt = time.Now()
	session.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, session)
	if err != nil {
		return err
	}

	session.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// READ - Find by email
func (r *SessionRepository) FindByEmail(email string) (*models.Session, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var session models.Session
	err := r.collection.FindOne(ctx, bson.M{
		"email": email,
	}).Decode(&session)

	if err != nil {
		return nil, err
	}

	return &session, nil
}

// READ - Find by ID
func (r *SessionRepository) FindByID(id string) (*models.Session, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var session models.Session
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&session)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

// READ - Find all active sessions
func (r *SessionRepository) FindAllActive() ([]models.Session, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"is_active": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var sessions []models.Session
	if err = cursor.All(ctx, &sessions); err != nil {
		return nil, err
	}

	return sessions, nil
}

// UPDATE - Update cookies
func (r *SessionRepository) UpdateCookies(email string, cookies string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"cookies":    cookies,
			"updated_at": time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}

// UPDATE - Update session
func (r *SessionRepository) Update(email string, session *models.Session) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	session.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"cookies":    session.Cookies,
			"updated_at": session.UpdatedAt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}

// UPDATE - Deactivate session
func (r *SessionRepository) Deactivate(email string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"is_active":  false,
			"updated_at": time.Now(),
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}

// DELETE - Delete session
func (r *SessionRepository) Delete(email string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"email": email})
	return err
}

// DELETE - Delete expired sessions
func (r *SessionRepository) DeleteExpired() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := r.collection.DeleteMany(ctx, bson.M{
		"expire_at": bson.M{"$lt": time.Now()},
	})

	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

// COUNT - Count active sessions
func (r *SessionRepository) CountActive() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{"is_active": true})
	if err != nil {
		return 0, err
	}

	return count, nil
}
