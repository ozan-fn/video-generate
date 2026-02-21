package lib

import (
	"fmt"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Account struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null;size:255"`
	Password  string    `gorm:"not null"`
	Count     int       `gorm:"default:0"`
	CreatedAt time.Time `gorm:"type:datetime(3);default:CURRENT_TIMESTAMP(3)"`
	UpdatedAt time.Time `gorm:"type:datetime(3);default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)"`
}

func InitDB() error {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		return fmt.Errorf("DB_DSN environment variable not set")
	}

	var gormErr error
	DB, gormErr = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if gormErr != nil {
		return gormErr
	}

	return DB.AutoMigrate(&Account{})
}
