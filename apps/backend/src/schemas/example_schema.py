from pydantic import BaseModel

# This is an example of a Pydantic schema that might be used for request/response validation.

class ExampleSchema(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
