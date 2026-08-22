import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  createTaxonomyItem,
  getAllTaxonomy,
  updateTaxonomyItem,
} from "../../services/taxonomy";

import type {
  PostCategory,
  PostTag,
} from "../../types/taxonomy";


/* ==========================================================
   ROFFLE ADMIN
   CATEGORIES + TAGS
   ========================================================== */


type EditableCategory =
  PostCategory;

type EditableTag =
  PostTag;


export default function TaxonomyManager() {
  const [
    categories,
    setCategories,
  ] =
    useState<EditableCategory[]>(
      []
    );

  const [
    tags,
    setTags,
  ] =
    useState<EditableTag[]>(
      []
    );

  const [
    newCategory,
    setNewCategory,
  ] =
    useState("");

  const [
    newTag,
    setNewTag,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    working,
    setWorking,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const load =
    async () => {
      setLoading(true);
      setError(null);

      try {
        const taxonomy =
          await getAllTaxonomy();

        setCategories(
          taxonomy.categories
        );

        setTags(
          taxonomy.tags
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load categories and tags."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const create =
    async (
      kind:
        "category"
        | "tag",
    ) => {
      const name =
        kind ===
          "category"
          ? newCategory
          : newTag;

      setWorking(
        `new-${kind}`
      );

      setError(null);

      try {
        await createTaxonomyItem(
          kind,
          name
        );

        if (
          kind ===
          "category"
        ) {
          setNewCategory("");
        } else {
          setNewTag("");
        }

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not create taxonomy item."
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  const saveCategory =
    async (
      category:
        EditableCategory,
    ) => {
      setWorking(
        category.id
      );

      try {
        await updateTaxonomyItem(
          "category",
          category.id,
          category.name,
          category.active
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not save category."
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  const saveTag =
    async (
      tag:
        EditableTag,
    ) => {
      setWorking(
        tag.id
      );

      try {
        await updateTaxonomyItem(
          "tag",
          tag.id,
          tag.name,
          tag.active
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not save tag."
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  return (
    <section className="admin-panel taxonomy-admin-panel">
      <header className="admin-panel-header">
        <div>
          <span className="admin-eyebrow">
            CONTROLLED VOCABULARY
          </span>

          <h2>
            Categories & tags
          </h2>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => {
            void load();
          }}
        >
          <RefreshCw
            size={14}
          />

          Refresh
        </button>
      </header>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          Loading taxonomy...
        </div>
      ) : (
        <div className="taxonomy-admin-grid">
          <section className="taxonomy-admin-column">
            <div className="taxonomy-column-heading">
              <div>
                <strong>
                  Categories
                </strong>

                <span>
                  One category per post
                </span>
              </div>

              <span>
                {categories.length}
              </span>
            </div>

            <div className="taxonomy-create-row">
              <input
                value={
                  newCategory
                }
                onChange={
                  (
                    event
                  ) => {
                    setNewCategory(
                      event.target
                        .value
                    );
                  }
                }
                placeholder="New category"
                maxLength={48}
              />

              <button
                type="button"
                disabled={
                  !newCategory.trim() ||
                  working ===
                    "new-category"
                }
                onClick={() => {
                  void create(
                    "category"
                  );
                }}
              >
                <Plus
                  size={13}
                />
                Add
              </button>
            </div>

            <div className="taxonomy-item-list">
              {categories.map(
                (
                  category,
                  index
                ) => (
                  <div
                    className={
                      category.active
                        ? "taxonomy-item"
                        : "taxonomy-item inactive"
                    }
                    key={
                      category.id
                    }
                  >
                    <input
                      value={
                        category.name
                      }
                      maxLength={48}
                      onChange={
                        (
                          event
                        ) => {
                          setCategories(
                            (
                              current
                            ) =>
                              current.map(
                                (
                                  item,
                                  itemIndex
                                ) =>
                                  itemIndex ===
                                    index
                                    ? {
                                        ...item,
                                        name:
                                          event.target
                                            .value,
                                      }
                                    : item
                              )
                          );
                        }
                      }
                    />

                    <button
                      className="taxonomy-status"
                      type="button"
                      onClick={() => {
                        setCategories(
                          (
                            current
                          ) =>
                            current.map(
                              (
                                item,
                                itemIndex
                              ) =>
                                itemIndex ===
                                  index
                                  ? {
                                      ...item,
                                      active:
                                        !item.active,
                                    }
                                  : item
                            )
                        );
                      }}
                    >
                      {category.active
                        ? "Active"
                        : "Disabled"}
                    </button>

                    <button
                      className="taxonomy-save"
                      type="button"
                      disabled={
                        working ===
                        category.id
                      }
                      onClick={() => {
                        void saveCategory(
                          category
                        );
                      }}
                    >
                      <Check
                        size={13}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="taxonomy-admin-column">
            <div className="taxonomy-column-heading">
              <div>
                <strong>
                  Article tags
                </strong>

                <span>
                  Users may choose up to five
                </span>
              </div>

              <span>
                {tags.length}
              </span>
            </div>

            <div className="taxonomy-create-row">
              <input
                value={
                  newTag
                }
                onChange={
                  (
                    event
                  ) => {
                    setNewTag(
                      event.target
                        .value
                    );
                  }
                }
                placeholder="New tag"
                maxLength={48}
              />

              <button
                type="button"
                disabled={
                  !newTag.trim() ||
                  working ===
                    "new-tag"
                }
                onClick={() => {
                  void create(
                    "tag"
                  );
                }}
              >
                <Plus
                  size={13}
                />
                Add
              </button>
            </div>

            <div className="taxonomy-item-list">
              {tags.map(
                (
                  tag,
                  index
                ) => (
                  <div
                    className={
                      tag.active
                        ? "taxonomy-item"
                        : "taxonomy-item inactive"
                    }
                    key={
                      tag.id
                    }
                  >
                    <input
                      value={
                        tag.name
                      }
                      maxLength={48}
                      onChange={
                        (
                          event
                        ) => {
                          setTags(
                            (
                              current
                            ) =>
                              current.map(
                                (
                                  item,
                                  itemIndex
                                ) =>
                                  itemIndex ===
                                    index
                                    ? {
                                        ...item,
                                        name:
                                          event.target
                                            .value,
                                      }
                                    : item
                              )
                          );
                        }
                      }
                    />

                    <button
                      className="taxonomy-status"
                      type="button"
                      onClick={() => {
                        setTags(
                          (
                            current
                          ) =>
                            current.map(
                              (
                                item,
                                itemIndex
                              ) =>
                                itemIndex ===
                                  index
                                  ? {
                                      ...item,
                                      active:
                                        !item.active,
                                    }
                                  : item
                            )
                        );
                      }}
                    >
                      {tag.active
                        ? "Active"
                        : "Disabled"}
                    </button>

                    <button
                      className="taxonomy-save"
                      type="button"
                      disabled={
                        working ===
                        tag.id
                      }
                      onClick={() => {
                        void saveTag(
                          tag
                        );
                      }}
                    >
                      <Check
                        size={13}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
